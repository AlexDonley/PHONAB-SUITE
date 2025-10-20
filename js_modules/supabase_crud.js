import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// ⚠️ Use only the ANON key here
const SUPABASE_URL = 'https://vhwsoclmscplhbawonmb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZod3NvY2xtc2NwbGhiYXdvbm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzEyMjIsImV4cCI6MjA3NTMwNzIyMn0.5-M_stfdkaAxSh0loboWOoha2dH0CeMYkTZQB9dFAQU'; // from Supabase dashboard


const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// CREATE functions
export async function addBook(title, lang, author) {
    const { data, error } = await supabase
        .from('books')
        .insert([{ title, lang, author }])
        .select()
        .single();
    if (error) console.error(error);
    else {
        console.log('Book added:', data)
        return data.id
    };
}

export async function addPart(bookId, award = null, text = []) {
  if (!bookId) {
    console.error('❌ Missing book ID.');
    return null;
  }

  const { data, error } = await supabase
    .from('parts')
    .insert([{ book_id: bookId, award, text }])
    .select()
    .single(); // return the inserted row

  if (error) {
    console.error('Error creating part:', error);
    return null;
  }

  console.log('✅ Part created:', data);
  return data;
}


export async function addBookWithParts(bookData, partsData = []) {
  // Step 1: Insert the book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert([{
      title: bookData.title,
      author: bookData.author,
      lang: bookData.lang,
      mercy_words: bookData.mercy_words || {}
    }])
    .select()
    .single();

  if (bookError) {
    console.error('❌ Error creating book:', bookError);
    return null;
  }

  console.log('✅ Book created:', book.id);

  // Step 2: Insert any parts (if provided)
  let parts = [];
  if (partsData.length > 0) {
    const partsToInsert = partsData.map(p => ({
      book_id: book.id,
      award: p.award || null,
      text: p.text || []
    }));

    const { data: insertedParts, error: partsError } = await supabase
      .from('parts')
      .insert(partsToInsert)
      .select();

    if (partsError) {
      console.error('❌ Error creating parts:', partsError);
    } else {
      parts = insertedParts;
      console.log(`✅ Created ${parts.length} parts for book ${book.id}`);
    }
  }

  return { book, parts };
}


// READ functions
export async function loadAllBooks() {
    const { data, error } = await supabase.from('books').select('*');
    if (error) console.error(error);
    console.log(data);

    return data
}

export async function getFilteredBooks({ lang, searchTerm, limit = 20 } = {}) {
    let query = supabase.from('books').select('*');

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
        console.error('Error fetching books:', error);
        return [];
    }

    return data;
}

export async function getBookParts(bookId) {
    if (!bookId) {
        console.error('❌ Missing book ID');
        return [];
    }

    const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('book_id', bookId)
        .order('id', { ascending: true }); // optional: keep parts in consistent order

    if (error) {
        console.error('Error fetching parts:', error);
        return [];
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

// Example: Create a new book


// Example: Update a book
export async function updateBook(id, newTitle) {
    await supabase.from('books').update({ title: newTitle }).eq('id', id);
}

// Example: Delete a book
export async function deleteBook(id) {
    await supabase.from('books').delete().eq('id', id);
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
