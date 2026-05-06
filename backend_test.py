#!/usr/bin/env python3
"""
ModSyndicate Backend API Testing Suite
Tests all endpoints after MongoDB → Supabase Postgres migration
"""
import requests
import os
import sys
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class ModSyndicateAPITester:
    def __init__(self):
        self.base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://build-forward-29.preview.emergentagent.com')
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')
        self.supabase_anon_key = os.environ.get('REACT_APP_SUPABASE_ANON_KEY')
        
        self.access_token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.test_email = "tester@modsyndicate.test"
        self.test_password = "TestPass123!"
        
        # Test data storage
        self.car_id: Optional[str] = None
        self.product_id: Optional[str] = None
        self.slot_id: Optional[str] = None
        self.booking_id: Optional[str] = None
        self.post_id: Optional[str] = None
        self.channel_id: Optional[str] = None
        self.garage_item_id: Optional[str] = None
        self.comment_id: Optional[str] = None
        
        # Test results
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, message: str, level: str = "info"):
        """Pretty print log messages"""
        if level == "success":
            print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")
        elif level == "error":
            print(f"{Colors.RED}❌ {message}{Colors.RESET}")
        elif level == "warning":
            print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")
        elif level == "info":
            print(f"{Colors.BLUE}ℹ️  {message}{Colors.RESET}")
        else:
            print(message)
    
    def section(self, title: str):
        """Print section header"""
        print(f"\n{Colors.BOLD}{'='*70}")
        print(f"  {title}")
        print(f"{'='*70}{Colors.RESET}\n")
    
    def setup_auth(self) -> bool:
        """Create test user and get JWT access token"""
        self.section("AUTHENTICATION SETUP")
        
        if not self.supabase_url or not self.supabase_service_key or not self.supabase_anon_key:
            self.log("Missing Supabase credentials in environment", "error")
            return False
        
        # Step 1: Create test user via Admin API (or get existing)
        self.log(f"Creating/fetching test user: {self.test_email}")
        try:
            headers = {
                "apikey": self.supabase_service_key,
                "Authorization": f"Bearer {self.supabase_service_key}",
                "Content-Type": "application/json"
            }
            
            # Try to create user
            response = requests.post(
                f"{self.supabase_url}/auth/v1/admin/users",
                headers=headers,
                json={
                    "email": self.test_email,
                    "password": self.test_password,
                    "email_confirm": True
                }
            )
            
            if response.status_code in (200, 201):
                user_data = response.json()
                self.user_id = user_data.get('id')
                self.log(f"Test user created: {self.user_id}", "success")
            elif response.status_code == 422:
                # User already exists, that's fine
                self.log("Test user already exists", "info")
            else:
                self.log(f"Failed to create user: {response.status_code} - {response.text}", "warning")
        
        except Exception as e:
            self.log(f"Error creating user: {e}", "warning")
        
        # Step 2: Sign in to get access token
        self.log("Signing in to get access token...")
        try:
            response = requests.post(
                f"{self.supabase_url}/auth/v1/token?grant_type=password",
                headers={
                    "apikey": self.supabase_anon_key,
                    "Content-Type": "application/json"
                },
                json={
                    "email": self.test_email,
                    "password": self.test_password
                }
            )
            
            if response.status_code == 200:
                auth_data = response.json()
                self.access_token = auth_data.get('access_token')
                user = auth_data.get('user', {})
                self.user_id = user.get('id')
                self.log(f"Successfully authenticated! User ID: {self.user_id}", "success")
                self.log(f"Access token: {self.access_token[:30]}...", "info")
                return True
            else:
                self.log(f"Failed to sign in: {response.status_code} - {response.text}", "error")
                return False
        
        except Exception as e:
            self.log(f"Error signing in: {e}", "error")
            return False
    
    def api_call(
        self,
        method: str,
        endpoint: str,
        expected_status: int,
        data: Optional[Dict[str, Any]] = None,
        auth_required: bool = True,
        description: str = ""
    ) -> tuple[bool, Optional[Dict[str, Any]]]:
        """Make API call and validate response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if auth_required and self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        self.tests_run += 1
        test_name = description or f"{method} /api/{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"{test_name} → {response.status_code}", "success")
                try:
                    return True, response.json()
                except:
                    return True, None
            else:
                self.log(f"{test_name} → Expected {expected_status}, got {response.status_code}", "error")
                self.failed_tests.append({
                    "test": test_name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                try:
                    return False, response.json()
                except:
                    return False, None
        
        except Exception as e:
            self.log(f"{test_name} → Exception: {e}", "error")
            self.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })
            return False, None
    
    def test_public_endpoints(self):
        """Test public endpoints (no auth required)"""
        self.section("1. PUBLIC ENDPOINTS (No Auth)")
        
        # Health check
        success, data = self.api_call("GET", "health", 200, auth_required=False, 
                                      description="Health check")
        if success and data:
            if data.get('status') == 'ok' and data.get('db') is True:
                self.log("  Database connection: OK", "info")
        
        # Products
        success, data = self.api_call("GET", "products", 200, auth_required=False,
                                      description="Get all products")
        if success and data:
            self.log(f"  Found {len(data)} products", "info")
            if len(data) >= 15:
                self.log("  Expected 15+ products found", "success")
                self.product_id = data[0].get('product_id')
            else:
                self.log(f"  Expected 15+ products, found {len(data)}", "warning")
        
        # Product detail
        if self.product_id:
            success, data = self.api_call("GET", f"products/oz-racing-ultraleggera", 200, 
                                          auth_required=False, description="Get product by slug")
        
        # Channels
        success, data = self.api_call("GET", "channels", 200, auth_required=False,
                                      description="Get all channels")
        if success and data:
            self.log(f"  Found {len(data)} channels", "info")
            if len(data) >= 8:
                self.log("  Expected 8+ channels found", "success")
                self.channel_id = data[0].get('channel_id')
        
        # Slots
        success, data = self.api_call("GET", "slots", 200, auth_required=False,
                                      description="Get available slots")
        if success and data:
            self.log(f"  Found {len(data)} slots", "info")
            if len(data) >= 28:
                self.log("  Expected 28+ slots found", "success")
                self.slot_id = data[0].get('slot_id')
        
        # Posts
        success, data = self.api_call("GET", "posts", 200, auth_required=False,
                                      description="Get community posts")
        if success and data:
            self.log(f"  Found {len(data)} posts", "info")
            if len(data) >= 4:
                self.log("  Expected 4+ posts found", "success")
                self.post_id = data[0].get('post_id')
        
        # Car makes
        success, data = self.api_call("GET", "cars/makes", 200, auth_required=False,
                                      description="Get car makes dictionary")
        if success and data:
            makes = data.get('makes', {})
            self.log(f"  Found {len(makes)} car makes", "info")
    
    def test_auth_gate(self):
        """Test that protected endpoints reject unauthenticated requests"""
        self.section("2. AUTH GATE (401 without token)")
        
        # Save current token
        saved_token = self.access_token
        self.access_token = None
        
        # Should get 401
        self.api_call("GET", "cars", 401, auth_required=True,
                     description="GET /cars without token")
        
        # Try with invalid token
        self.access_token = "fake_invalid_token"
        self.api_call("GET", "cars", 401, auth_required=True,
                     description="GET /cars with invalid token")
        
        # Restore token
        self.access_token = saved_token
    
    def test_auth_me(self):
        """Test auth/me endpoint and profile auto-creation"""
        self.section("3. AUTH ME + AUTO-PROFILE CREATION")
        
        success, data = self.api_call("GET", "auth/me", 200,
                                      description="GET /auth/me (auto-create profile)")
        if success and data:
            self.log(f"  User ID: {data.get('user_id')}", "info")
            self.log(f"  Email: {data.get('email')}", "info")
            self.log(f"  Has cars: {data.get('has_cars')}", "info")
        
        # Update profile
        success, data = self.api_call("PUT", "auth/me", 200,
                                      data={"name": "Test User", "phone": "+919876543210"},
                                      description="PUT /auth/me (update profile)")
        if success and data:
            self.log(f"  Updated name: {data.get('name')}", "info")
    
    def test_cars_crud(self):
        """Test cars CRUD operations"""
        self.section("4. CARS CRUD")
        
        # Get empty cars list
        success, data = self.api_call("GET", "cars", 200,
                                      description="GET /cars (should be empty initially)")
        
        # Create first car (should be is_primary=true)
        success, data = self.api_call("POST", "cars", 200,
                                      data={
                                          "make": "Mahindra",
                                          "model": "Thar",
                                          "year": 2024,
                                          "variant": "LX",
                                          "color": "Red"
                                      },
                                      description="POST /cars (create first car)")
        if success and data:
            self.car_id = data.get('car_id')
            is_primary = data.get('is_primary')
            self.log(f"  Car ID: {self.car_id}", "info")
            self.log(f"  Is primary: {is_primary}", "info")
            if is_primary:
                self.log("  First car correctly set as primary", "success")
        
        # Create second car (should be is_primary=false)
        second_car_id = None
        success, data = self.api_call("POST", "cars", 200,
                                      data={
                                          "make": "BMW",
                                          "model": "M3",
                                          "year": 2023,
                                          "variant": "Competition",
                                          "color": "Isle of Man Green"
                                      },
                                      description="POST /cars (create second car)")
        if success and data:
            second_car_id = data.get('car_id')
            is_primary = data.get('is_primary')
            self.log(f"  Second car ID: {second_car_id}", "info")
            if not is_primary:
                self.log("  Second car correctly NOT primary", "success")
        
        # Get cars list (should have 2)
        success, data = self.api_call("GET", "cars", 200,
                                      description="GET /cars (should have 2 cars)")
        if success and data:
            self.log(f"  Total cars: {len(data)}", "info")
        
        # Delete second car
        if second_car_id:
            self.api_call("DELETE", f"cars/{second_car_id}", 200,
                         description=f"DELETE /cars/{second_car_id}")
    
    def test_garage_operations(self):
        """Test garage operations"""
        self.section("5. GARAGE OPERATIONS")
        
        if not self.car_id or not self.product_id:
            self.log("Skipping garage tests - missing car_id or product_id", "warning")
            return
        
        # Get empty garage
        success, data = self.api_call("GET", f"garage/{self.car_id}", 200,
                                      description=f"GET /garage/{self.car_id} (empty)")
        
        # Add product to garage
        success, data = self.api_call("POST", "garage", 200,
                                      data={
                                          "car_id": self.car_id,
                                          "product_id": self.product_id,
                                          "quantity": 1
                                      },
                                      description="POST /garage (add product, qty=1)")
        
        # Add same product again (should merge to qty=2)
        success, data = self.api_call("POST", "garage", 200,
                                      data={
                                          "car_id": self.car_id,
                                          "product_id": self.product_id,
                                          "quantity": 1
                                      },
                                      description="POST /garage (add same product, should merge)")
        
        # Get garage with items
        success, data = self.api_call("GET", f"garage/{self.car_id}", 200,
                                      description=f"GET /garage/{self.car_id} (with items)")
        if success and data:
            self.log(f"  Garage items: {len(data)}", "info")
            if len(data) > 0:
                item = data[0]
                self.garage_item_id = item.get('item_id')
                quantity = item.get('quantity')
                self.log(f"  Quantity: {quantity}", "info")
                if quantity == 2:
                    self.log("  ON CONFLICT merge working correctly", "success")
                product = item.get('product')
                if product:
                    self.log(f"  Product embedded: {product.get('name')}", "success")
        
        # Get garage total
        success, data = self.api_call("GET", f"garage/{self.car_id}/total", 200,
                                      description=f"GET /garage/{self.car_id}/total")
        if success and data:
            total_parts = data.get('total_parts', 0)
            total_labour = data.get('total_labour', 0)
            total = data.get('total', 0)
            self.log(f"  Parts: ₹{total_parts:,.2f}, Labour: ₹{total_labour:,.2f}, Total: ₹{total:,.2f}", "info")
    
    def test_booking_flow(self):
        """Test complete booking flow"""
        self.section("6. BOOKING FLOW")
        
        if not self.car_id or not self.slot_id:
            self.log("Skipping booking tests - missing car_id or slot_id", "warning")
            return
        
        # Get user bookings (empty)
        success, data = self.api_call("GET", "bookings", 200,
                                      description="GET /bookings (empty)")
        
        # Create booking
        success, data = self.api_call("POST", "bookings", 200,
                                      data={
                                          "car_id": self.car_id,
                                          "slot_id": self.slot_id,
                                          "pickup_address": "123 Test Street, Bangalore, Karnataka 560001"
                                      },
                                      description="POST /bookings (create booking)")
        if success and data:
            self.booking_id = data.get('booking_id')
            booking_code = data.get('booking_code')
            status = data.get('status')
            total = data.get('total_amount')
            self.log(f"  Booking code: {booking_code}", "info")
            self.log(f"  Status: {status}", "info")
            self.log(f"  Total: ₹{total:,.2f}", "info")
            if booking_code and booking_code.startswith('MS-'):
                self.log("  Booking code format correct (MS-YYYY-NNNN)", "success")
        
        # Get user bookings (should have 1)
        success, data = self.api_call("GET", "bookings", 200,
                                      description="GET /bookings (with data)")
        if success and data:
            self.log(f"  Total bookings: {len(data)}", "info")
        
        # Get single booking
        if self.booking_id:
            success, data = self.api_call("GET", f"bookings/{self.booking_id}", 200,
                                          description=f"GET /bookings/{self.booking_id}")
        
        # Check garage is now empty (cleared on booking)
        success, data = self.api_call("GET", f"garage/{self.car_id}", 200,
                                      description=f"GET /garage/{self.car_id} (should be empty after booking)")
        if success and data:
            if len(data) == 0:
                self.log("  Garage correctly cleared after booking", "success")
            else:
                self.log(f"  WARNING: Garage still has {len(data)} items", "warning")
        
        # Cancel booking
        if self.booking_id:
            success, data = self.api_call("PUT", f"bookings/{self.booking_id}/cancel", 200,
                                          description=f"PUT /bookings/{self.booking_id}/cancel")
            if success:
                self.log("  Booking cancelled, booked_count should be decremented", "success")
    
    def test_community_posts(self):
        """Test community posts, votes, likes, comments, save"""
        self.section("7. COMMUNITY: POSTS, VOTES, LIKES, COMMENTS, SAVE")
        
        # Create post
        success, data = self.api_call("POST", "posts", 200,
                                      data={
                                          "caption": "My Thar build is coming along nicely! 🔥",
                                          "media_urls": ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800"],
                                          "channel_id": self.channel_id,
                                          "tagged_products": [self.product_id] if self.product_id else []
                                      },
                                      description="POST /posts (create post)")
        if success and data:
            test_post_id = data.get('post_id')
            self.log(f"  Created post: {test_post_id}", "info")
            
            # Test voting on this new post
            if test_post_id:
                # Upvote
                success, vote_data = self.api_call("POST", f"posts/{test_post_id}/vote", 200,
                                                   data={"vote": "up"},
                                                   description="POST /posts/{id}/vote (upvote)")
                if success and vote_data:
                    self.log(f"  Vote: {vote_data.get('vote')}", "info")
                
                # Switch to downvote
                success, vote_data = self.api_call("POST", f"posts/{test_post_id}/vote", 200,
                                                   data={"vote": "down"},
                                                   description="POST /posts/{id}/vote (switch to downvote)")
                if success and vote_data:
                    self.log(f"  Vote switched to: {vote_data.get('vote')}", "info")
                
                # Remove vote (vote same again)
                success, vote_data = self.api_call("POST", f"posts/{test_post_id}/vote", 200,
                                                   data={"vote": "down"},
                                                   description="POST /posts/{id}/vote (remove vote)")
                if success and vote_data:
                    vote = vote_data.get('vote')
                    if vote is None:
                        self.log("  Vote removed correctly", "success")
                
                # Like post
                success, like_data = self.api_call("POST", f"posts/{test_post_id}/like", 200,
                                                   description="POST /posts/{id}/like (like)")
                if success and like_data:
                    liked = like_data.get('liked')
                    self.log(f"  Liked: {liked}", "info")
                
                # Unlike post
                success, like_data = self.api_call("POST", f"posts/{test_post_id}/like", 200,
                                                   description="POST /posts/{id}/like (unlike)")
                if success and like_data:
                    liked = like_data.get('liked')
                    if not liked:
                        self.log("  Unlike working correctly", "success")
                
                # Save post
                success, save_data = self.api_call("POST", f"posts/{test_post_id}/save", 200,
                                                   description="POST /posts/{id}/save (save)")
                if success and save_data:
                    saved = save_data.get('saved')
                    self.log(f"  Saved: {saved}", "info")
                
                # Add comment
                success, comment_data = self.api_call("POST", f"posts/{test_post_id}/comments", 200,
                                                      data={"content": "Awesome build! Love the modifications 🚗"},
                                                      description="POST /posts/{id}/comments (add comment)")
                if success and comment_data:
                    self.comment_id = comment_data.get('comment_id')
                    self.log(f"  Comment added: {self.comment_id}", "info")
                
                # Get comments
                success, comments = self.api_call("GET", f"posts/{test_post_id}/comments", 200,
                                                  auth_required=False,
                                                  description="GET /posts/{id}/comments")
                if success and comments:
                    self.log(f"  Total comments: {len(comments)}", "info")
                    if len(comments) > 0:
                        comment = comments[0]
                        author = comment.get('author', {})
                        if author:
                            self.log(f"  Comment author info embedded: {author.get('name')}", "success")
    
    def test_channels(self):
        """Test channel operations"""
        self.section("8. CHANNELS")
        
        if not self.channel_id:
            self.log("Skipping channel tests - no channel_id", "warning")
            return
        
        # Join channel
        success, data = self.api_call("POST", f"channels/{self.channel_id}/join", 200,
                                      description=f"POST /channels/{self.channel_id}/join (join)")
        if success and data:
            joined = data.get('joined')
            self.log(f"  Joined: {joined}", "info")
            if joined:
                self.log("  Member count should be incremented", "success")
        
        # Leave channel (join again to toggle)
        success, data = self.api_call("POST", f"channels/{self.channel_id}/join", 200,
                                      description=f"POST /channels/{self.channel_id}/join (leave)")
        if success and data:
            joined = data.get('joined')
            if not joined:
                self.log("  Left channel, member count should be decremented", "success")
        
        # Create new channel
        success, data = self.api_call("POST", "channels", 200,
                                      data={
                                          "name": "Test Channel - Off-Road Builds",
                                          "description": "Share your off-road modifications and adventures"
                                      },
                                      description="POST /channels (create new channel)")
        if success and data:
            new_channel_id = data.get('channel_id')
            self.log(f"  Created channel: {new_channel_id}", "info")
    
    def test_admin_endpoints(self):
        """Test admin endpoints"""
        self.section("9. ADMIN ENDPOINTS")
        
        # Promote to admin
        success, data = self.api_call("POST", "admin/init", 200,
                                      description="POST /admin/init (promote to admin)")
        if success:
            self.log("  User promoted to admin", "success")
        else:
            # If it fails because admin already exists, that's fine
            self.log("  Admin already exists (expected if running multiple times)", "info")
        
        # Get all bookings (admin only)
        success, data = self.api_call("GET", "admin/bookings", 200,
                                      description="GET /admin/bookings (admin only)")
        if success and data:
            self.log(f"  Total bookings (all users): {len(data)}", "info")
        
        # Update booking status
        if self.booking_id:
            success, data = self.api_call("PUT", f"admin/bookings/{self.booking_id}/status", 200,
                                          data={"status": "in_workshop"},
                                          description=f"PUT /admin/bookings/{self.booking_id}/status")
            if success:
                self.log("  Booking status updated to 'in_workshop'", "success")
        
        # Create slot (admin only)
        success, data = self.api_call("POST", "admin/slots", 200,
                                      data={
                                          "date": "2025-02-15",
                                          "start_time": "14:00",
                                          "end_time": "16:00",
                                          "capacity": 3
                                      },
                                      description="POST /admin/slots (create slot)")
        if success and data:
            new_slot_id = data.get('slot_id')
            self.log(f"  Created slot: {new_slot_id}", "info")
    
    def print_summary(self):
        """Print final test summary"""
        self.section("TEST SUMMARY")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print(f"{Colors.BOLD}Total Tests: {self.tests_run}{Colors.RESET}")
        print(f"{Colors.GREEN}Passed: {self.tests_passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {len(self.failed_tests)}{Colors.RESET}")
        print(f"{Colors.BLUE}Success Rate: {success_rate:.1f}%{Colors.RESET}\n")
        
        if len(self.failed_tests) > 0:
            print(f"{Colors.RED}{Colors.BOLD}FAILED TESTS:{Colors.RESET}")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {failure.get('test')}")
                if 'expected' in failure:
                    print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
                    print(f"   Response: {failure.get('response', 'N/A')}")
                if 'error' in failure:
                    print(f"   Error: {failure['error']}")
        
        if self.tests_passed == self.tests_run:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.RESET}\n")
            return 0
        else:
            print(f"\n{Colors.YELLOW}⚠️  Some tests failed. Review above for details.{Colors.RESET}\n")
            return 1
    
    def run_all_tests(self):
        """Run complete test suite"""
        print(f"\n{Colors.BOLD}{'='*70}")
        print(f"  ModSyndicate Backend API Test Suite")
        print(f"  Testing Supabase Postgres Migration")
        print(f"{'='*70}{Colors.RESET}\n")
        
        print(f"Base URL: {self.base_url}")
        print(f"Supabase URL: {self.supabase_url}\n")
        
        # Setup authentication
        if not self.setup_auth():
            self.log("Authentication setup failed. Cannot proceed with tests.", "error")
            return 1
        
        # Run all test suites
        self.test_public_endpoints()
        self.test_auth_gate()
        self.test_auth_me()
        self.test_cars_crud()
        self.test_garage_operations()
        self.test_booking_flow()
        self.test_community_posts()
        self.test_channels()
        self.test_admin_endpoints()
        
        # Print summary
        return self.print_summary()

def main():
    tester = ModSyndicateAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
