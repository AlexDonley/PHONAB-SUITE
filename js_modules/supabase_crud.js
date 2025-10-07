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
        .insert([{ title, lang, author }]);
    if (error) console.error(error);
    else console.log('Book added:', data);
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

// Call loadAllBooks on page load
// loadAllBooks();