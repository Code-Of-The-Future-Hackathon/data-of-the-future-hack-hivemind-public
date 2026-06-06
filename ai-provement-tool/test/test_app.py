import pytest
from fastapi.testclient import TestClient
from app import app  # Import your FastAPI app
from unittest.mock import patch
import httpx
import json

client = TestClient(app)

@patch('app.evaluate_task_completion')
def test_evaluate_endpoint_success(mock_evaluate):
    """
    Tests the /evaluate endpoint with a successful mock AI response.
    """
    # Mock the AI function to return a successful completion
    mock_evaluate.return_value = {
        "is_completed": True,
        "reason": "Mock AI successfully evaluated the image."
    }

    task_data = {"id": 1, "title": "Test Task", "description": "A task for testing."}
    image_url = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764423449/hivemind-uploads/y9xbrjk1cwiysotw96yv.png"
    
    response = client.post(
        "/evaluate",
        data={
            "task": json.dumps(task_data),
            "user_text": "Here is my proof.",
            "image_urls": json.dumps([image_url]),
        },
    )

    assert response.status_code == 200
    json_response = response.json()
    assert json_response["is_completed"] is True
    assert "Mock AI" in json_response["reason"]
    # Ensure the mock was called
    mock_evaluate.assert_called_once()

def test_evaluate_invalid_json():
    """
    Tests the /evaluate endpoint with malformed task JSON.
    """
    image_url = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764423449/hivemind-uploads/y9xbrjk1cwiysotw96yv.png"

    response = client.post(
        "/evaluate",
        data={
            "task": "{'id':1, 'title':'bad json'}",
            "user_text": "",
            "image_urls": json.dumps([image_url]),
        },
    )
    assert response.status_code == 400
    assert "Invalid task JSON" in response.json()["detail"]

def test_evaluate_invalid_image_url():
    """Tests the /evaluate endpoint with a missing/invalid image_url."""

    task_data = {"id": 2, "title": "Another Task"}

    response = client.post(
        "/evaluate",
        data={"task": json.dumps(task_data), "image_urls": json.dumps(["invalid_url"])},
    )

    assert response.status_code == 400
    assert "image_url" in response.json()["detail"].lower()

def test_evaluate_with_real_ai():
    """Tests the /evaluate endpoint with a real image and the actual AI model via Groq.

    This test makes a live API call, so it only asserts that the response is well-formed,
    not that the task is definitely marked completed (since that depends on the model
    and account limits).
    """
    # 1. Define the task and image URL
    task_data = {"id": 99, "title": "Run 10km", "description": "Go for a 10-kilometer run."}
    image_url = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764423449/hivemind-uploads/y9xbrjk1cwiysotw96yv.png"

    # 2. Call the endpoint directly with the image URL
    response = client.post(
        "/evaluate",
        data={
            "task": json.dumps(task_data),
            "user_text": "I went for a run, here is my proof.",
            "image_urls": json.dumps([image_url]),
        },
    )

    # 4. Assert the response structure
    assert response.status_code == 200
    json_response = response.json()

    print(f"AI Response: {json_response}")  # Print the reason for debugging

    # We only require that the keys exist and reason is a non-empty string.
    assert "is_completed" in json_response
    assert "reason" in json_response
    assert isinstance(json_response["reason"], str) and len(json_response["reason"]) > 0


def test_evaluate_with_real_ai_image_1():
    """Real AI test with an alternative proof image URL #1."""

    task_data = {"id": 100, "title": "Run 10km", "description": "Go for a 10-kilometer run."}
    image_url = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764431158/hivemind-uploads/d5jhnyisuluhiltobifx.jpg"

    response = client.post(
        "/evaluate",
        data={
            "task": json.dumps(task_data),
            "user_text": "This is me finishing the 10 km run.",
            "image_urls": json.dumps([image_url]),
        },
    )

    assert response.status_code == 200
    json_response = response.json()
    print(f"AI Response (image 1): {json_response}")
    assert "is_completed" in json_response
    assert "reason" in json_response
    assert isinstance(json_response["reason"], str) and len(json_response["reason"]) > 0


def test_evaluate_with_real_ai_image_2():
    """Real AI test with an alternative proof image URL #2."""

    task_data = {"id": 101, "title": "Run 10km", "description": "Go for a 10-kilometer run."}
    image_url = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764431158/hivemind-uploads/ivvcfogoyycktr7fruuy.jpg"

    response = client.post(
        "/evaluate",
        data={
            "task": json.dumps(task_data),
            "user_text": "This is a fake proof image.",
            "image_urls": json.dumps([image_url]),
        },
    )

    assert response.status_code == 200
    json_response = response.json()
    print(f"AI Response (image 2): {json_response}")
    assert "is_completed" in json_response
    assert "reason" in json_response
    assert isinstance(json_response["reason"], str) and len(json_response["reason"]) > 0


def test_evaluate_with_real_ai_image_3():
    """Real AI test with an alternative proof image URL #3."""

    task_data = {"id": 102, "title": "Run 10km", "description": "Go for a 10-kilometer run."}
    image_url_1 = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764431157/hivemind-uploads/nwvmejmky0iwnx9xrm22.jpg"
    image_url_2 = "https://res.cloudinary.com/dcmyi9sja/image/upload/v1764431158/hivemind-uploads/d5jhnyisuluhiltobifx.jpg"

    response = client.post(
        "/evaluate",
        data={
            "task": json.dumps(task_data),
            "user_text": "This is me lifting weights after completing the 10km run.",
            "image_urls": json.dumps([image_url_1, image_url_2]),
        },
    )

    assert response.status_code == 200
    json_response = response.json()
    print(f"AI Response (image 3): {json_response}")
    assert "is_completed" in json_response
    assert "reason" in json_response
    assert isinstance(json_response["reason"], str) and len(json_response["reason"]) > 0


