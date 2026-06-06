# 🧠 HiveMind: Connect. Conquer. Thrive.

## 🌟 Project Overview

**HiveMind** is a unique, supportive social media platform designed to connect individuals facing similar life challenges. It moves beyond passive communication by integrating an **AI companion** that actively guides users through their personal struggles, transforming difficulties into achievable goals.

Our mission is to foster a community where shared experience becomes a catalyst for **positive change**, turning isolation into collaboration.

---

## 🔑 Key Features

* **Peer-to-Peer Support Chats:** Connect with other users who share the same or similar life problems in a private, supportive environment.
* **AI Companion & Quests:** An integrated AI chatbot provides personalized guidance by:
    * Issuing **Quests** (small, actionable steps) and **Milestones** (larger goals) relevant to the user's specific challenges.
    * Offering tailored **Suggestions for Contact** with other users based on high-similarity profiles, facilitating meaningful connections.
* **Proof-of-Completion System:** Quests are verified by the user uploading **image or video proof**, which is then analyzed by the AI to ensure completion.
* **Point & Gamification:** A **Point System** rewards users with points for successfully completing quests and milestones, encouraging progress, persistence, and engagement.

---

## 🛠 Prerequisites

To run HiveMind on your **local machine**, you need to have the following core technologies installed:

| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Backend application server and package management. |
| **Python** | AI/Machine Learning components and core logic. |
| **PostgreSQL** | Primary relational database for user, quest, and proof data. |

Additionally, you will need to install the specific **Node.js and Python libraries** as listed in the project's `package.json` and `requirements.txt` files, respectively.

---

## ⚙️ Installation (Local Host Setup)

Follow these steps to set up and run the HiveMind project locally.

### 1. Database Setup (PostgreSQL)

1.  **Install PostgreSQL:** Download and install the appropriate version for your operating system from the [official PostgreSQL website](https://www.postgresql.org/download/).
2.  **Create Database:** Use the `psql` command-line tool or a GUI client (like pgAdmin) to create the project database.
    ```bash
    CREATE DATABASE hivemind_db;
    ```
3.  **Configuration:** Update the database connection settings in the appropriate configuration file (e.g., a `.env` file) to match your local PostgreSQL credentials (username, password, and database name `hivemind_db`).

### 2. Backend Setup (Node.js)

1.  **Install Node.js:** Ensure you have **Node.js (LTS recommended)** installed.
2.  **Navigate to Backend Directory:** Open your terminal and change the directory to the project's backend folder.
3.  **Install Dependencies:** Install all required Node.js libraries.
    ```bash
    npm install
    ```
4.  **Run Backend Server:** Start the Node.js server.
    ```bash
    npm start
    ```

### 3. AI/ML Setup (Python)

1.  **Install Python:** Ensure you have **Python 3.x** installed.
2.  **Navigate to Python Directory:** Change the directory to the folder containing your AI/Python components.
3.  **Create Virtual Environment (Recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate # On Linux/macOS
    # .\venv\Scripts\activate # On Windows
    ```
4.  **Install Dependencies:** Install all required Python libraries.
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run Python AI Service:** Start the service, which may run as a separate process or be called by the Node.js backend.
    ```bash
    python ai_service.py # Replace with the actual startup file name
    ```

### 4. Accessing HiveMind

Once all services are running, you should be able to access the HiveMind application in your web browser, typically at:

> 🌐 **`http://localhost:3000`** (or the port specified in your Node.js configuration)

---

## 🧑‍💻 Team

The development of HiveMind is a collaborative effort by the following dedicated team members:

| Name | Role | GitHub |
| :--- | :--- | :--- |
| **Oleksandur Vinichenko** | Front-End and Back-End Developer | @vinipux28 |
| **Yuan Tomov** | AI/ML Specialist, Back-End Developer | @YVTomov22 |
| **Tsvetan Zhekov** | AI/ML Specialist, Back-End Developer | @TPZhekov22 |
| **Kaloyan Petrov** | UX/UI Designer. Frontend Developer | @KSPetrov22 |
| **Anton Babev** | QA, UX/UI Designer | @AKBabev22 |