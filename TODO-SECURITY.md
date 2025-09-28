# Rate Limiting and CSRF Protection Implementation

## Information Gathered
- Client-side web app using Supabase backend for authentication and data
- Multiple API calls via js/supabase.js and js/api.js
- Forms in transfer.html, withdraw.html, deposit.html, settings.html
- Supabase provides some built-in security, but client-side protections needed

## Plan
### 1. Implement Client-Side Rate Limiting
- [ ] Add rate limiting utility to js/utils.js
  - Create RateLimiter class with configurable limits per endpoint
  - Track requests per time window (e.g., 10 requests per minute)
  - Queue excessive requests or show user-friendly errors
- [ ] Update js/supabase.js to use rate limiting for all API calls
- [ ] Update js/api.js if exists to use rate limiting

### 2. Implement CSRF Protection
- [ ] Add CSRF token generation utility to js/utils.js
  - Generate random tokens for each session/form
  - Store tokens securely (localStorage with expiration)
- [ ] Update forms to include CSRF tokens
  - transfer.html: Add hidden CSRF input to transfer form
  - withdraw.html: Add hidden CSRF input to withdrawal form
  - deposit.html: Add hidden CSRF input to deposit form
  - settings.html: Add hidden CSRF input to profile/password forms
- [ ] Update form submission handlers to validate CSRF tokens

### 3. Update Supabase Integration
- [ ] Ensure Supabase auth tokens are properly handled
- [ ] Add CSRF validation on sensitive operations

### 4. Testing and Validation
- [ ] Test rate limiting: Make excessive API calls, verify throttling
- [ ] Test CSRF protection: Attempt form submissions without tokens
- [ ] Verify error handling and user feedback

## Dependent Files to Edit
- js/utils.js: Add RateLimiter class and CSRF utilities
- js/supabase.js: Integrate rate limiting into API calls
- transfer.html: Add CSRF token to form
- withdraw.html: Add CSRF token to form
- deposit.html: Add CSRF token to form
- settings.html: Add CSRF token to forms

## Followup Steps
- [ ] Test rate limiting behavior
- [ ] Verify CSRF protection works
- [ ] Update main TODO.md to mark as completed
