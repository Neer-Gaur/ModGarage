#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Migrate ModSyndicate (formerly ModGarage) from MongoDB + Emergent Google Auth to
  Supabase (Postgres + Auth + Storage). Frontend will be hosted on Hostinger Business
  (modsyndicate.in), backend on Render free tier, DB on Supabase free tier.

  Migration scope:
  - Replace MongoDB driver (motor) with SQLAlchemy + asyncpg using Supabase Transaction Pooler
  - Replace Emergent session-cookie auth with Supabase JWT bearer auth
  - Replace URL-based image inputs with direct Supabase Storage uploads
  - Single SQL setup script for tables, RLS, buckets, seed data

backend:
  - task: "Supabase DB connectivity (Transaction Pooler)"
    implemented: true
    working: true
    file: "backend/database.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "DATABASE_URL with URL-encoded password works. /api/health returns db:true. asyncpg statement_cache_size=0 set per Supabase pooler requirements."

  - task: "Public read-only endpoints (no auth)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Verified via curl: /api/products → 15 items, /api/channels → 8, /api/slots → 28, /api/posts → 4, /api/cars/makes returns full dict."

  - task: "JWT auth — protected endpoints reject unauthenticated requests"
    implemented: true
    working: true
    file: "backend/auth.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: true
          agent: "main"
          comment: "/api/cars without token returns 401. Need testing agent to verify with valid Supabase JWT that all auth-protected endpoints work and that the auto-create-profile logic in _ensure_profile fires correctly."

  - task: "Cars CRUD (auth-required)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Endpoints implemented: POST /api/cars (create), GET /api/cars (list), DELETE /api/cars/{id}. is_primary auto-set on first car. Need automated testing with a JWT."

  - task: "Garage operations (auth-required)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST /api/garage uses ON CONFLICT to merge duplicate adds. GET /api/garage/{car_id} joins products via row_to_json. GET total uses COALESCE+SUM. Need testing with real auth."

  - task: "Booking flow (slot lock + create + cancel)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST /api/bookings uses SELECT FOR UPDATE on slot, computes totals from garage, increments booked_count, clears garage. Booking code MS-YYYY-NNNN. Cancel decrements booked_count. Need testing."

  - task: "Community: posts, votes, likes, comments, save"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST /api/posts with optional channel_id/car_id (nullable casts). Vote toggle logic with delta math on upvotes/downvotes/vote_count. Likes and saves are simple toggles. Comments support parent_comment_id for threading. tagged_products returns enriched product details."

  - task: "Admin endpoints + role gate"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "/api/admin/init promotes first user to admin. get_current_admin guard checks role='admin'. Endpoints: PUT /api/admin/bookings/{id}/status, POST /api/admin/slots, GET /api/admin/bookings."

frontend:
  - task: "Supabase Auth integration (Google OAuth)"
    implemented: true
    working: "NA"
    file: "frontend/src/context/AuthContext.js, frontend/src/lib/supabase.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Replaced Emergent auth with @supabase/supabase-js. PKCE flow, persistSession=true. AuthContext listens to onAuthStateChange and refetches /api/auth/me on SIGNED_IN/TOKEN_REFRESHED. Cannot test without Google OAuth provider configured by user."

  - task: "Axios JWT bearer interceptor"
    implemented: true
    working: true
    file: "frontend/src/lib/api.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Single axios instance with request interceptor that pulls fresh access_token from Supabase session. All 9 page files refactored to use this helper."

  - task: "Image upload to Supabase Storage (Community posts)"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/Community.js, frontend/src/lib/supabase.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "uploadToBucket('post-media', file, userId) helper. Replaces text URL input with file picker. 10MB limit, content-type preserved. Cannot test without authenticated user."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 0
  run_ui: false
  migration: "MongoDB → Supabase Postgres complete"

test_plan:
  current_focus:
    - "JWT auth — protected endpoints reject unauthenticated requests"
    - "Cars CRUD (auth-required)"
    - "Garage operations (auth-required)"
    - "Booking flow (slot lock + create + cancel)"
    - "Community: posts, votes, likes, comments, save"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"
  notes: |
    Backend testing approach: Generate a Supabase JWT for a test user via the
    Supabase Admin API (using the service_role key) so the testing agent can
    exercise auth-protected endpoints. Or instruct the testing agent to:
    1. Use the service_role key to mint an admin user via the auth.admin.createUser API
    2. Use the user's access_token in subsequent /api/* calls

agent_communication:
    - agent: "main"
      message: |
        Migration from MongoDB → Supabase Postgres is complete. Database URL with
        URL-encoded password works (/api/health returns db:true). All 15 products,
        8 channels, 28 slots, 4 posts seeded successfully. Public endpoints verified
        via curl. Auth-protected endpoints correctly return 401 without a token.

        Need testing agent to:
        1. Create a test user via Supabase Auth admin API (using SUPABASE_SERVICE_KEY)
        2. Get an access_token for that user
        3. Test all auth-protected endpoints (cars, garage, bookings, community)
        4. Verify the auto-create-profile trigger fires on first /api/auth/me
        5. Confirm vote toggle math is correct (upvote → switch to downvote → remove)

        Env vars are set in /app/backend/.env. SUPABASE_URL and SUPABASE_SERVICE_KEY
        are available for the testing agent to mint test JWTs.
