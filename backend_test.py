import requests
import sys
import json
from datetime import datetime

class ModGarageAPITester:
    def __init__(self, base_url="https://build-forward-29.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = "test_session_1775814406027"  # From mongosh creation
        self.user_id = "test-user-1775814406027"
        self.tests_run = 0
        self.tests_passed = 0
        self.car_id = None
        self.product_id = None
        self.slot_id = None
        self.booking_id = None
        self.post_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_products_api(self):
        """Test products endpoints"""
        print("\n" + "="*50)
        print("TESTING PRODUCTS API")
        print("="*50)
        
        # Test get all products
        success, products = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200,
            auth_required=False
        )
        
        if success and products:
            print(f"   Found {len(products)} products")
            if len(products) >= 15:
                print("✅ Expected 15+ seeded products found")
                self.product_id = products[0].get('product_id')
            else:
                print(f"⚠️  Expected 15+ products, found {len(products)}")
        
        # Test category filtering
        self.run_test(
            "Filter Products by Category (rims)",
            "GET",
            "products?category=rims",
            200,
            auth_required=False
        )
        
        # Test search
        self.run_test(
            "Search Products",
            "GET",
            "products?search=carbon",
            200,
            auth_required=False
        )

    def test_cars_api(self):
        """Test cars endpoints"""
        print("\n" + "="*50)
        print("TESTING CARS API")
        print("="*50)
        
        # Test get car makes
        success, makes_data = self.run_test(
            "Get Car Makes Dictionary",
            "GET",
            "cars/makes",
            200,
            auth_required=False
        )
        
        if success and makes_data:
            makes = makes_data.get('makes', {})
            print(f"   Found {len(makes)} car makes")
            if 'BMW' in makes and 'Honda' in makes:
                print("✅ Expected car makes found (BMW, Honda)")
        
        # Test get user cars (should be empty initially)
        self.run_test(
            "Get User Cars (Empty)",
            "GET",
            "cars",
            200
        )
        
        # Test create car
        success, car_data = self.run_test(
            "Create User Car",
            "POST",
            "cars",
            200,
            data={
                "make": "BMW",
                "model": "3 Series",
                "year": 2024,
                "variant": "M Sport",
                "color": "Alpine White"
            }
        )
        
        if success and car_data:
            self.car_id = car_data.get('car_id')
            print(f"   Created car with ID: {self.car_id}")

    def test_garage_api(self):
        """Test garage endpoints"""
        print("\n" + "="*50)
        print("TESTING GARAGE API")
        print("="*50)
        
        if not self.car_id or not self.product_id:
            print("❌ Skipping garage tests - missing car_id or product_id")
            return
        
        # Test get empty garage
        self.run_test(
            "Get Empty Garage",
            "GET",
            f"garage/{self.car_id}",
            200
        )
        
        # Test add to garage
        success, _ = self.run_test(
            "Add Product to Garage",
            "POST",
            "garage",
            200,
            data={
                "car_id": self.car_id,
                "product_id": self.product_id,
                "quantity": 1
            }
        )
        
        # Test get garage with items
        success, garage_items = self.run_test(
            "Get Garage with Items",
            "GET",
            f"garage/{self.car_id}",
            200
        )
        
        if success and garage_items:
            print(f"   Found {len(garage_items)} items in garage")
        
        # Test get garage total
        success, total_data = self.run_test(
            "Get Garage Total Cost",
            "GET",
            f"garage/{self.car_id}/total",
            200
        )
        
        if success and total_data:
            total = total_data.get('total', 0)
            print(f"   Total cost: ₹{total:,}")

    def test_slots_api(self):
        """Test booking slots endpoints"""
        print("\n" + "="*50)
        print("TESTING SLOTS API")
        print("="*50)
        
        # Test get available slots
        success, slots = self.run_test(
            "Get Available Booking Slots",
            "GET",
            "slots",
            200,
            auth_required=False
        )
        
        if success and slots:
            print(f"   Found {len(slots)} available slots")
            if len(slots) >= 28:
                print("✅ Expected 28+ seeded slots found")
                self.slot_id = slots[0].get('slot_id')
            else:
                print(f"⚠️  Expected 28+ slots, found {len(slots)}")

    def test_bookings_api(self):
        """Test bookings endpoints"""
        print("\n" + "="*50)
        print("TESTING BOOKINGS API")
        print("="*50)
        
        if not self.car_id or not self.slot_id:
            print("❌ Skipping booking tests - missing car_id or slot_id")
            return
        
        # Test get user bookings (empty)
        self.run_test(
            "Get User Bookings (Empty)",
            "GET",
            "bookings",
            200
        )
        
        # Test create booking
        success, booking_data = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data={
                "car_id": self.car_id,
                "slot_id": self.slot_id,
                "pickup_address": "123 Test Street, Test City, 12345"
            }
        )
        
        if success and booking_data:
            self.booking_id = booking_data.get('booking_id')
            booking_code = booking_data.get('booking_code')
            print(f"   Created booking: {booking_code}")
        
        # Test get user bookings (with booking)
        success, bookings = self.run_test(
            "Get User Bookings (With Data)",
            "GET",
            "bookings",
            200
        )
        
        if success and bookings:
            print(f"   Found {len(bookings)} bookings")

    def test_community_api(self):
        """Test community/posts endpoints"""
        print("\n" + "="*50)
        print("TESTING COMMUNITY API")
        print("="*50)
        
        # Test get posts
        success, posts = self.run_test(
            "Get Community Posts",
            "GET",
            "posts",
            200,
            auth_required=False
        )
        
        if success and posts:
            print(f"   Found {len(posts)} community posts")
            if len(posts) >= 4:
                print("✅ Expected 4+ seeded posts found")
                self.post_id = posts[0].get('post_id')
            else:
                print(f"⚠️  Expected 4+ posts, found {len(posts)}")
        
        # Test create post
        success, post_data = self.run_test(
            "Create Community Post",
            "POST",
            "posts",
            200,
            data={
                "caption": "Test post from API testing",
                "media_urls": ["https://images.unsplash.com/photo-1774576320208-9914d1fc5be5?w=600&h=400&fit=crop"],
                "tagged_products": [self.product_id] if self.product_id else []
            }
        )
        
        if success and post_data:
            test_post_id = post_data.get('post_id')
            print(f"   Created test post: {test_post_id}")
        
        # Test like post
        if self.post_id:
            self.run_test(
                "Like Community Post",
                "POST",
                f"posts/{self.post_id}/like",
                200
            )
        
        # Test get comments
        if self.post_id:
            self.run_test(
                "Get Post Comments",
                "GET",
                f"posts/{self.post_id}/comments",
                200,
                auth_required=False
            )
        
        # Test add comment
        if self.post_id:
            self.run_test(
                "Add Comment to Post",
                "POST",
                f"posts/{self.post_id}/comments",
                200,
                data={"content": "Great build! Love the setup."}
            )

    def test_auth_api(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTH API")
        print("="*50)
        
        # Test auth/me endpoint
        success, user_data = self.run_test(
            "Get Current User Info",
            "GET",
            "auth/me",
            200
        )
        
        if success and user_data:
            user_id = user_data.get('user_id')
            email = user_data.get('email')
            has_cars = user_data.get('has_cars')
            print(f"   User: {email} (ID: {user_id})")
            print(f"   Has cars: {has_cars}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting ModGarage API Testing")
        print(f"🔗 Base URL: {self.base_url}")
        print(f"🔑 Session Token: {self.session_token[:20]}...")
        
        # Test in logical order
        self.test_auth_api()
        self.test_products_api()
        self.test_cars_api()
        self.test_garage_api()
        self.test_slots_api()
        self.test_bookings_api()
        self.test_community_api()
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = ModGarageAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())