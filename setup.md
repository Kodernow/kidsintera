# kidsintera

### 3. Configure Environment Variables
Create a .env file in the root directory and add your Supabase credentials:
```env
# Copy from .env.example and update with your actual values
cp .env.example .env

# Required Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Payment Gateway Keys (for production)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key

# See .env.example for all available configuration options
```

#### Getting Supabase Credentials:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings > API
4. Copy the Project URL and anon/public key
5. Update your .env file with these values

### 4. Run the Development Server
```bash