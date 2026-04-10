"""
Backend API tests for ModGarage Community features (Reddit-style)
Tests: Channels, Posts, Voting, Saving, Comments
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestChannelsAPI:
    """Tests for GET /api/channels endpoint"""
    
    def test_get_channels_returns_list(self):
        """GET /api/channels should return list of channels"""
        response = requests.get(f"{BASE_URL}/api/channels")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/channels returns {len(data)} channels")
    
    def test_get_channels_has_8_seeded_channels(self):
        """Should have 8 seeded channels"""
        response = requests.get(f"{BASE_URL}/api/channels")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 8, f"Expected 8 channels, got {len(data)}"
        print("✓ 8 seeded channels present")
    
    def test_channel_has_required_fields(self):
        """Each channel should have name, slug, member_count, post_count"""
        response = requests.get(f"{BASE_URL}/api/channels")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        channel = data[0]
        required_fields = ['channel_id', 'name', 'slug', 'member_count', 'post_count', 'description']
        for field in required_fields:
            assert field in channel, f"Missing field: {field}"
        print(f"✓ Channel has all required fields: {required_fields}")
    
    def test_channel_slugs_match_expected(self):
        """Verify expected channel slugs are present"""
        response = requests.get(f"{BASE_URL}/api/channels")
        assert response.status_code == 200
        data = response.json()
        slugs = [ch['slug'] for ch in data]
        expected_slugs = [
            'mahindra-thar-club', 'toyota-supra-builds', 'bmw-m-series', 
            'jdm-legends', 'mustang-nation', 'off-road-warriors', 
            'track-day-diaries', 'show-and-shine'
        ]
        for slug in expected_slugs:
            assert slug in slugs, f"Missing channel slug: {slug}"
        print(f"✓ All 8 expected channel slugs present")


class TestPostsAPI:
    """Tests for GET /api/posts endpoint"""
    
    def test_get_posts_returns_list(self):
        """GET /api/posts should return list of posts"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/posts returns {len(data)} posts")
    
    def test_posts_have_vote_fields(self):
        """Posts should have vote_count, upvotes, downvotes"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "No posts found"
        post = data[0]
        assert 'vote_count' in post, "Missing vote_count"
        assert 'upvotes' in post, "Missing upvotes"
        assert 'downvotes' in post, "Missing downvotes"
        print(f"✓ Post has vote fields: vote_count={post['vote_count']}, upvotes={post['upvotes']}, downvotes={post['downvotes']}")
    
    def test_posts_have_channel_info(self):
        """Posts should have channel info when assigned to a channel"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        posts_with_channel = [p for p in data if p.get('channel')]
        assert len(posts_with_channel) > 0, "No posts with channel info"
        post = posts_with_channel[0]
        assert 'channel' in post
        assert 'name' in post['channel']
        assert 'slug' in post['channel']
        print(f"✓ Post has channel info: {post['channel']['name']}")
    
    def test_posts_have_author_info(self):
        """Posts should have author info"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        post = data[0]
        assert 'author' in post
        assert 'name' in post['author']
        print(f"✓ Post has author info: {post['author']['name']}")


class TestPostsFiltering:
    """Tests for posts filtering by channel"""
    
    def test_filter_by_channel_slug(self):
        """GET /api/posts?channel=jdm-legends should filter posts"""
        response = requests.get(f"{BASE_URL}/api/posts?channel=jdm-legends")
        assert response.status_code == 200
        data = response.json()
        # All returned posts should be in jdm-legends channel
        for post in data:
            if post.get('channel'):
                assert post['channel']['slug'] == 'jdm-legends', f"Post in wrong channel: {post['channel']['slug']}"
        print(f"✓ Channel filter works: {len(data)} posts in jdm-legends")
    
    def test_filter_by_bmw_channel(self):
        """GET /api/posts?channel=bmw-m-series should filter posts"""
        response = requests.get(f"{BASE_URL}/api/posts?channel=bmw-m-series")
        assert response.status_code == 200
        data = response.json()
        for post in data:
            if post.get('channel'):
                assert post['channel']['slug'] == 'bmw-m-series'
        print(f"✓ BMW channel filter works: {len(data)} posts")
    
    def test_filter_nonexistent_channel_returns_empty(self):
        """Filtering by non-existent channel should return empty list"""
        response = requests.get(f"{BASE_URL}/api/posts?channel=nonexistent-channel")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0, "Should return empty list for non-existent channel"
        print("✓ Non-existent channel returns empty list")


class TestPostsSorting:
    """Tests for posts sorting"""
    
    def test_sort_by_top(self):
        """GET /api/posts?sort_by=top should sort by vote_count descending"""
        response = requests.get(f"{BASE_URL}/api/posts?sort_by=top")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 1:
            vote_counts = [p.get('vote_count', 0) for p in data]
            assert vote_counts == sorted(vote_counts, reverse=True), "Posts not sorted by vote_count"
        print(f"✓ sort_by=top works: vote_counts={[p.get('vote_count', 0) for p in data[:3]]}")
    
    def test_sort_by_new(self):
        """GET /api/posts?sort_by=new should sort by created_at descending"""
        response = requests.get(f"{BASE_URL}/api/posts?sort_by=new")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 1:
            dates = [p.get('created_at', '') for p in data]
            assert dates == sorted(dates, reverse=True), "Posts not sorted by created_at"
        print(f"✓ sort_by=new works")
    
    def test_sort_by_hot(self):
        """GET /api/posts?sort_by=hot should return 200"""
        response = requests.get(f"{BASE_URL}/api/posts?sort_by=hot")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ sort_by=hot works: {len(data)} posts")


class TestAuthRequiredEndpoints:
    """Tests for endpoints that require authentication"""
    
    def test_vote_requires_auth(self):
        """POST /api/posts/{id}/vote should return 401 without auth"""
        # Get a post ID first
        posts_response = requests.get(f"{BASE_URL}/api/posts")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]['post_id']
            response = requests.post(
                f"{BASE_URL}/api/posts/{post_id}/vote",
                json={"vote": "up"}
            )
            assert response.status_code == 401, f"Expected 401, got {response.status_code}"
            print(f"✓ POST /api/posts/{post_id}/vote returns 401 without auth")
    
    def test_save_requires_auth(self):
        """POST /api/posts/{id}/save should return 401 without auth"""
        posts_response = requests.get(f"{BASE_URL}/api/posts")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]['post_id']
            response = requests.post(f"{BASE_URL}/api/posts/{post_id}/save")
            assert response.status_code == 401, f"Expected 401, got {response.status_code}"
            print(f"✓ POST /api/posts/{post_id}/save returns 401 without auth")
    
    def test_create_channel_requires_auth(self):
        """POST /api/channels should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/channels",
            json={"name": "Test Channel", "description": "Test"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/channels returns 401 without auth")
    
    def test_create_post_requires_auth(self):
        """POST /api/posts should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/posts",
            json={"caption": "Test post", "media_urls": [], "tagged_products": []}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/posts returns 401 without auth")
    
    def test_comment_requires_auth(self):
        """POST /api/posts/{id}/comments should return 401 without auth"""
        posts_response = requests.get(f"{BASE_URL}/api/posts")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]['post_id']
            response = requests.post(
                f"{BASE_URL}/api/posts/{post_id}/comments",
                json={"content": "Test comment"}
            )
            assert response.status_code == 401, f"Expected 401, got {response.status_code}"
            print(f"✓ POST /api/posts/{post_id}/comments returns 401 without auth")


class TestCommentsAPI:
    """Tests for comments endpoint"""
    
    def test_get_comments_returns_list(self):
        """GET /api/posts/{id}/comments should return list"""
        posts_response = requests.get(f"{BASE_URL}/api/posts")
        posts = posts_response.json()
        if len(posts) > 0:
            post_id = posts[0]['post_id']
            response = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ GET /api/posts/{post_id}/comments returns list with {len(data)} comments")


class TestPostDetails:
    """Tests for post detail fields"""
    
    def test_post_has_tagged_products(self):
        """Posts should have tagged_product_details when products are tagged"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        posts_with_products = [p for p in data if p.get('tagged_product_details')]
        if len(posts_with_products) > 0:
            post = posts_with_products[0]
            product = post['tagged_product_details'][0]
            assert 'product_id' in product
            assert 'name' in product
            assert 'slug' in product
            print(f"✓ Post has tagged products: {[p['name'] for p in post['tagged_product_details']]}")
        else:
            print("⚠ No posts with tagged products found")
    
    def test_post_has_media_urls(self):
        """Posts should have media_urls field"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        post = data[0]
        assert 'media_urls' in post
        print(f"✓ Post has media_urls: {len(post.get('media_urls', []))} images")
    
    def test_post_has_comments_count(self):
        """Posts should have comments_count field"""
        response = requests.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        post = data[0]
        assert 'comments_count' in post
        print(f"✓ Post has comments_count: {post['comments_count']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
