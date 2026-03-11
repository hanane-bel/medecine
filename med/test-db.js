const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    console.log(`Testing connection to Supabase at: ${supabaseUrl}`);
    try {
        // A generic query to check connection
        const { data, error } = await supabase.from('users').select('*').limit(1);

        if (error) {
            if (error.code === 'PGRST116' || error.code === '42P01') {
                // Connected successfully, but the 'users' table doesn't exist or is not exposed perfectly via PostgREST
                console.log('✅ Connexion réussie à Supabase PostgreSQL.');
                console.warn(`(Note: la table 'users' n'est pas accessible, ce qui est normal : ${error.message})`);
            } else {
                console.error('❌ Erreur lors de la requête de vérification :', error.message);
            }
        } else {
            console.log('✅ Connexion réussie à Supabase PostgreSQL.');
            console.log('Data reçue :', data);
        }
    } catch (err) {
        console.error('❌ Échec de la connexion :', err.message);
    }
}

testConnection();
