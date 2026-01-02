import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ezxbjzlyokxlckgrwcjb.supabase.co'
const supabaseAnonKey = 'sb_publishable_EuPUmBbFwQIJGW0sToziiQ_Offut5ez'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)