import { createClient } from 'https://esm.sh/@supabase/supabase-js';
// import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// TO DO: convert 
// to source -> section -> fragment -> token

const SUPABASE_URL = 'https://vhwsoclmscplhbawonmb.supabase.co'
const SUPABASE_PUBLIC_KEY = 'sb_publishable_xJTWezcmsCfP4TfYf4wmEA_WdDfgkO5'

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLIC_KEY
);

// CREATE functions
export async function addSource(title, lang, author) {
    const { data, error } = await supabase
        .from('sources')
        .insert([{ title, lang, author }])
        .select()
        .single();
    if (error) console.error(error);
    else {
        console.log('Source added:', data)
        return data.id
    };
}

export async function addPart(sourceId, award = null, text = []) {
    if (!sourceId) {
        console.error('❌ Missing source ID.');
        return null;
    }

    const { data, error } = await supabase
        .from('parts')
        .insert([{ source_id: sourceId, award, text }])
        .select()
        .single(); // return the inserted row

    if (error) {
        console.error('Error creating part:', error);
        return null;
    }

    console.log('✅ Part created:', data);
    return data;
}


export async function addSourceWithParts(sourceData, partsData = []) {
    // Step 1: Insert the source
    const { data: source, error: sourceError } = await supabase
        .from('sources')
        .insert([{
            title: sourceData.title,
            author: sourceData.author,
            lang: sourceData.lang,
            mercy_words: sourceData.mercy_words || {}
        }])
        .select()
        .single();

    if (sourceError) {
        console.error('❌ Error creating source:', sourceError);
        return null;
    }

    console.log('✅ Source created:', source.id);

    // Step 2: Insert any parts (if provided)
    let parts = [];
    if (partsData.length > 0) {
        const partsToInsert = partsData.map(p => ({
            source_id: source.id,
            award: p.award || null,
            text: p.text || [],
            idx: p.idx || 0
        }));

        const { data: insertedParts, error: partsError } = await supabase
        .from('parts')
        .insert(partsToInsert)
        .select();

        if (partsError) {
            console.error('❌ Error creating parts:', partsError);
        } else {
            parts = insertedParts;
            console.log(`✅ Created ${parts.length} parts for source ${source.id}`);
        }
    }

    return { source, parts };
}


// READ functions
export async function loadAllSources() {
    const { data, error } = await supabase.from('sources').select('*');
    if (error) console.error(error);
    console.log(data);

    return data
}

export async function getFilteredSources({ lang, searchTerm, limit = 20 } = {}) {
    let query = supabase.from('sources').select('*');

    // Filter by language if provided
    if (lang) {
        query = query.eq('lang', lang);
    }

    // Filter by search term in title or author (case-insensitive)
    if (searchTerm) {
        const ilikePattern = `%${searchTerm}%`;
        query = query.or(`title.ilike.${ilikePattern},author.ilike.${ilikePattern}`);
    }

    // Limit number of results
    query = query.limit(limit);

    // Execute query
    const { data, error } = await query;

    if (error) {
        console.error('Error fetching sources:', error);
        return [];
    }

    return data;
}

export async function getSourceParts(sourceId) {
    if (!sourceId) {
        console.error('❌ Missing source ID');
        return [];
    }

    const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('source_id', sourceId)
        .order('idx', { ascending: true }); // optional: keep parts in consistent order

    if (error) {
        console.error('Error fetching parts:', error);
        return [];
    }

    return data;
}

export async function getSourceById(sourceId) {
    if (!sourceId) {
        console.error('❌ Missing part ID');
        return null;
    }

    const { data, error } = await supabase
        .from('sources')
        .select('*')
        .eq('id', sourceId)
        .single(); // expects only one record

    if (error) {
        console.error('Error fetching part:', error);
        return null;
    }

    return data;
}

export async function getPartById(partId) {
    if (!partId) {
        console.error('❌ Missing part ID');
        return null;
    }

    const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('id', partId)
        .single(); // expects only one record

    if (error) {
        console.error('Error fetching part:', error);
        return null;
    }

    return data;
}

// Example: Create a new source


// Example: Update a source
export async function updateSource(id, newTitle) {
    await supabase.from('sources').update({ title: newTitle }).eq('id', id);
}

export async function updateSourceWithParts(sourceId, sourceData, partsData = []) {
    // Step 1: Update the source row that matches sourceId
    const { data: source, error: sourceError } = await supabase
        .from('sources')
        .update({
            title: sourceData.title,
            author: sourceData.author,
            // lang: sourceData.lang,
            mercy_words: sourceData.mercy_words ?? {}
        })
        .eq('id', sourceId)      // <-- the "which row?" filter
        .select()
        .single();

    if (sourceError) {
        console.error('❌ Error updating source:', sourceError);
        return null;
    }

    console.log('✅ Source updated:', source.id);

    // Step 2: Update each provided part, matched by its own id
    let parts = [];
    if (partsData.length > 0) {
        const results = await Promise.all(
            partsData.map(p =>
                supabase
                    .from('parts')
                    .update({
                        award: p.award ?? null,
                        text: p.text ?? [],
                    })
                    .eq('id', p.id)              // which part
                    .eq('source_id', sourceId)   // safety: must belong to this source
                    .select()
                    .single()
            )
        );

        const failed = results.filter(r => r.error);
        if (failed.length > 0) {
            console.error('❌ Error updating parts:', failed.map(r => r.error));
        }

        parts = results.filter(r => !r.error).map(r => r.data);
        console.log(`✅ Updated ${parts.length}/${partsData.length} parts for source ${source.id}`);
    }

    return { source, parts };
}



// Example: Delete a source
export async function deleteSource(id) {
    await supabase.from('sources').delete().eq('id', id);
}

// Incorporating a local cache

/*
    TO DO: come back to this later, it's complicated and it scares me
    Generic Supabase caching wrapper
    
    @param {string} cacheKey - Unique name for the cached data.
    @param {Function} fetchFn - Async function returning { data, error } from Supabase.
    @param {number} [ttl=300000] - Cache lifetime in milliseconds (default 5 minutes).
    @returns {Promise<Array|Object>} Cached or fresh data.
*/

export async function fetchWithCache(cacheKey, fetchFn, ttl = 5 * 60 * 1000) {
    // Try to get cached version
    const cached = JSON.parse(localStorage.getItem(cacheKey));

    if (cached && Date.now() - cached.timestamp < ttl) {
        // Return cached data immediately (fast UI)
        refreshInBackground(cacheKey, fetchFn); // background update
        return cached.data;
    }

    // Otherwise fetch fresh data
    const { data, error } = await fetchFn();
    if (error) {
        console.error(`Error fetching ${cacheKey}:`, error);
        return cached ? cached.data : []; // fallback to stale data if exists
    }

    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
    }));

    return data;
}

/*
    Refresh cache asynchronously (non-blocking)
*/
export async function refreshInBackground(cacheKey, fetchFn) {
    const { data, error } = await fetchFn();
    if (!error && data) {
        localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
        }));
    }
}
