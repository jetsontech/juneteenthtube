import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setAdminRole(email) {
    if (!email) {
        console.error("Please provide an email. Usage: node set_admin_role.mjs <email>");
        return;
    }
    console.log(`Searching for user with email: ${email}`);

    // Fetch user by email via Auth Admin API
    // Since List Users is paginated, we might need a direct query if the list is huge,
    // but typically we can retrieve a few and find them or use standard methods.
    // For Supabase, the easiest direct admin access is listUsers().
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const targetUser = users.find(u => u.email === email);

    if (!targetUser) {
        console.error(`User with email ${email} not found in Auth system.`);
        console.log("Found users:", users.map(u => u.email));
        return;
    }

    console.log(`Found user: ${targetUser.id}. Setting role to 'admin' in user_metadata...`);

    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { user_metadata: { ...targetUser.user_metadata, role: 'admin' } }
    );

    if (updateError) {
        console.error("Failed to update user role:", updateError);
    } else {
        console.log("Successfully granted admin privileges to", email);
        console.log("Updated metadata:", data.user.user_metadata);
    }
}

// Run using the env variable
setAdminRole(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
