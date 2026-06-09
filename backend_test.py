"""Backend API tests for Mod Syndicate."""
import requests
import sys
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

class ModSyndicateAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_email = f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}@modsyn.com"
        self.test_password = "TestPass123!"
        self.product_id = None
        self.garage_item_id = None
        self.booking_id = None

    def log(self, msg, status="INFO"):
        prefix = {"PASS": "✅", "FAIL": "❌", "INFO": "🔍"}.get(status, "ℹ️")
        print(f"{prefix} {msg}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test."""
        url = f"{self.base_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                self.log(f"Unknown method {method}", "FAIL")
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASSED - Status: {response.status_code}", "PASS")
            else:
                self.log(f"FAILED - Expected {expected_status}, got {response.status_code}", "FAIL")
                try:
                    self.log(f"Response: {response.text[:200]}", "INFO")
                except:
                    pass

            try:
                return success, response.json() if response.text else {}
            except:
                return success, {}

        except Exception as e:
            self.log(f"FAILED - Error: {str(e)}", "FAIL")
            return False, {}

    def test_health(self):
        """Test health endpoint."""
        success, response = self.run_test("Health Check", "GET", "health", 200)
        if success and response.get("status") == "ok":
            self.log("Health endpoint returns 'ok'", "PASS")
            return True
        return False

    def test_products_list(self):
        """Test products listing."""
        success, response = self.run_test("List Products", "GET", "products", 200)
        if success and isinstance(response, list) and len(response) >= 15:
            self.log(f"Products endpoint returns {len(response)} products (>= 15)", "PASS")
            # Store first product ID for later tests
            if response:
                self.product_id = response[0].get("id")
            return True
        elif success:
            self.log(f"Products endpoint returns only {len(response)} products (expected >= 15)", "FAIL")
        return False

    def test_product_categories(self):
        """Test product categories."""
        success, response = self.run_test("Product Categories", "GET", "products/categories", 200)
        if success and isinstance(response, list) and len(response) > 0:
            self.log(f"Categories endpoint returns {len(response)} categories: {response}", "PASS")
            return True
        return False

    def test_products_filter_category(self):
        """Test product filtering by category."""
        success, response = self.run_test("Filter Products by Category", "GET", "products?category=wheels", 200)
        if success and isinstance(response, list):
            # Check if all returned products are wheels
            all_wheels = all(p.get("category") == "wheels" for p in response)
            if all_wheels and len(response) > 0:
                self.log(f"Category filter works - {len(response)} wheels products", "PASS")
                return True
            elif len(response) == 0:
                self.log("Category filter returns empty list", "FAIL")
        return False

    def test_products_search(self):
        """Test product search."""
        success, response = self.run_test("Search Products (ECU)", "GET", "products?search=ECU", 200)
        if success and isinstance(response, list) and len(response) >= 1:
            self.log(f"Search returns {len(response)} products for 'ECU'", "PASS")
            return True
        elif success:
            self.log("Search for 'ECU' returns no products", "FAIL")
        return False

    def test_register(self):
        """Test user registration."""
        success, response = self.run_test(
            "Register New User",
            "POST",
            "auth/register",
            200,
            data={"email": self.test_email, "password": self.test_password, "name": "Test User"}
        )
        if success and response.get("access_token") and response.get("user"):
            self.token = response["access_token"]
            self.user = response["user"]
            self.log(f"Registration successful - User ID: {self.user.get('id')}", "PASS")
            # Verify no password_hash in response
            if "password_hash" in response.get("user", {}):
                self.log("WARNING: password_hash exposed in user object", "FAIL")
                return False
            return True
        return False

    def test_login(self):
        """Test user login."""
        success, response = self.run_test(
            "Login with Registered Credentials",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_email, "password": self.test_password}
        )
        if success and response.get("access_token"):
            self.token = response["access_token"]
            self.log("Login successful", "PASS")
            return True
        return False

    def test_auth_me(self):
        """Test /auth/me endpoint."""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success and response.get("id") and "password_hash" not in response:
            self.log(f"Auth/me returns user without password_hash", "PASS")
            return True
        elif success and "password_hash" in response:
            self.log("CRITICAL: password_hash exposed in /auth/me", "FAIL")
        return False

    def test_profile_update(self):
        """Test profile update (onboarding)."""
        success, response = self.run_test(
            "Update Profile (Onboarding)",
            "PUT",
            "auth/profile",
            200,
            data={
                "name": "Test User Updated",
                "phone": "+919876543210",
                "car_model": "Hyundai i20",
                "car_year": 2023,
                "car_color": "Midnight Blue",
                "specs": "N-Line Turbo"
            }
        )
        if success and response.get("onboarded") == True:
            self.log("Profile update sets onboarded=true", "PASS")
            return True
        elif success:
            self.log(f"Profile updated but onboarded={response.get('onboarded')}", "FAIL")
        return False

    def test_add_to_garage(self):
        """Test adding product to garage."""
        if not self.product_id:
            self.log("No product_id available, skipping garage test", "FAIL")
            return False
        
        success, response = self.run_test(
            "Add Product to Garage",
            "POST",
            "garage",
            200,
            data={"product_id": self.product_id, "note": "Test garage item"}
        )
        if success and response.get("id"):
            self.garage_item_id = response.get("id")
            self.log(f"Product added to garage - Item ID: {self.garage_item_id}", "PASS")
            return True
        return False

    def test_list_garage(self):
        """Test listing garage items."""
        success, response = self.run_test("List Garage Items", "GET", "garage", 200)
        if success and isinstance(response, list):
            # Check if product is hydrated
            if len(response) > 0 and response[0].get("product"):
                self.log(f"Garage list returns {len(response)} items with hydrated products", "PASS")
                return True
            elif len(response) > 0:
                self.log("Garage items returned but products not hydrated", "FAIL")
            else:
                self.log("Garage list is empty (expected at least 1 item)", "FAIL")
        return False

    def test_booking_quote(self):
        """Test booking quote."""
        if not self.product_id:
            self.log("No product_id available, skipping quote test", "FAIL")
            return False
        
        success, response = self.run_test(
            "Get Booking Quote",
            "POST",
            "bookings/quote",
            200,
            data={
                "product_ids": [self.product_id],
                "scheduled_date": "2025-09-15",
                "scheduled_slot": "10:00-12:00"
            }
        )
        if success and all(k in response for k in ["subtotal", "install_fee", "taxes", "total"]):
            self.log(f"Quote: subtotal={response['subtotal']}, total={response['total']}", "PASS")
            return True
        return False

    def test_create_booking(self):
        """Test creating a booking."""
        if not self.product_id:
            self.log("No product_id available, skipping booking test", "FAIL")
            return False
        
        success, response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data={
                "product_ids": [self.product_id],
                "scheduled_date": "2025-09-15",
                "scheduled_slot": "10:00-12:00",
                "notes": "Test booking"
            }
        )
        if success and response.get("id") and response.get("status") == "confirmed" and response.get("payment_status") == "paid_mock":
            self.booking_id = response.get("id")
            self.log(f"Booking created - ID: {self.booking_id}, status: confirmed, payment: paid_mock", "PASS")
            return True
        elif success:
            self.log(f"Booking created but status={response.get('status')}, payment={response.get('payment_status')}", "FAIL")
        return False

    def test_list_bookings(self):
        """Test listing bookings."""
        success, response = self.run_test("List Bookings", "GET", "bookings", 200)
        if success and isinstance(response, list) and len(response) > 0:
            self.log(f"Bookings list returns {len(response)} bookings", "PASS")
            return True
        elif success:
            self.log("Bookings list is empty (expected at least 1)", "FAIL")
        return False

    def test_community_posts(self):
        """Test community posts listing."""
        success, response = self.run_test("List Community Posts", "GET", "community/posts", 200)
        if success and isinstance(response, list):
            self.log(f"Community posts returns {len(response)} posts (demo or real)", "PASS")
            return True
        return False

    def test_create_post(self):
        """Test creating a community post."""
        success, response = self.run_test(
            "Create Community Post",
            "POST",
            "community/posts",
            200,
            data={
                "title": "Test Build Post",
                "body": "This is a test post from automated testing",
                "car_model": "Hyundai i20",
                "tags": ["test"]
            }
        )
        if success and response.get("id"):
            self.log(f"Post created - ID: {response.get('id')}", "PASS")
            return True
        return False

    def test_community_events(self):
        """Test community events listing."""
        success, response = self.run_test("List Community Events", "GET", "community/events", 200)
        if success and isinstance(response, list) and len(response) >= 5:
            self.log(f"Events endpoint returns {len(response)} events (>= 5)", "PASS")
            return True
        elif success:
            self.log(f"Events endpoint returns only {len(response)} events (expected >= 5)", "FAIL")
        return False

    def test_community_reviews(self):
        """Test community reviews listing."""
        success, response = self.run_test("List Community Reviews", "GET", "community/reviews", 200)
        if success and isinstance(response, list) and len(response) >= 4:
            self.log(f"Reviews endpoint returns {len(response)} reviews (>= 4)", "PASS")
            return True
        elif success:
            self.log(f"Reviews endpoint returns only {len(response)} reviews (expected >= 4)", "FAIL")
        return False

    def test_contact_submit(self):
        """Test contact form submission."""
        success, response = self.run_test(
            "Submit Contact Form",
            "POST",
            "contact",
            200,
            data={
                "name": "Test User",
                "email": "test@example.com",
                "message": "This is a test message",
                "phone": "+919876543210"
            }
        )
        if success and response.get("ok"):
            self.log("Contact form submission successful", "PASS")
            return True
        return False

    def test_auth_protection(self):
        """Test that protected endpoints return 401 without token."""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, _ = self.run_test("Protected Endpoint (No Token)", "GET", "garage", 401)
        
        # Restore token
        self.token = original_token
        
        if success:
            self.log("Protected endpoints correctly return 401 without token", "PASS")
            return True
        return False

    def run_all_tests(self):
        """Run all backend tests in sequence."""
        print("\n" + "="*60)
        print("MOD SYNDICATE BACKEND API TESTS")
        print("="*60 + "\n")
        
        # Basic endpoints
        self.test_health()
        self.test_products_list()
        self.test_product_categories()
        self.test_products_filter_category()
        self.test_products_search()
        
        # Auth flow
        self.test_register()
        self.test_login()
        self.test_auth_me()
        self.test_profile_update()
        
        # Garage
        self.test_add_to_garage()
        self.test_list_garage()
        
        # Bookings
        self.test_booking_quote()
        self.test_create_booking()
        self.test_list_bookings()
        
        # Community
        self.test_community_posts()
        self.test_create_post()
        self.test_community_events()
        self.test_community_reviews()
        
        # Contact
        self.test_contact_submit()
        
        # Auth protection
        self.test_auth_protection()
        
        # Print summary
        print("\n" + "="*60)
        print(f"TESTS COMPLETED: {self.tests_passed}/{self.tests_run} PASSED")
        print("="*60 + "\n")
        
        return 0 if self.tests_passed == self.tests_run else 1


def main():
    tester = ModSyndicateAPITester()
    return tester.run_all_tests()


if __name__ == "__main__":
    sys.exit(main())
