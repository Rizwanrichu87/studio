# AI Habitual: Smart Habit Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI Habitual is a modern, AI-powered habit tracking application designed to help you build, track, and maintain good habits. It provides intelligent insights, personalized recommendations, and motivation to keep you on track with your goals.

![AI Habitual Dashboard](https://storage.googleapis.com/aifire.dev/public/screenshots/ai-habitual-dashboard.png)

## ✨ Features

- **Daily Habit Tracking:** Easily track your daily, weekly, or monthly habits. Support for habits that need to be completed multiple times a day.
- **AI-Powered Insights:**
    - **Motivational Tips:** Get personalized motivational tips based on your progress.
    - **AI Coach:** Receive recommendations to optimize your habit-building journey by sharing your goals.
    - **Success Prediction:** An AI model predicts your likelihood of success based on your activity and goals.
    - **Collision Detection:** The AI checks for potential scheduling conflicts between your habits.
- **Progress Visualization:**
    - **Interactive Calendar:** View your completed days at a glance.
    - **Weekly Reports:** See a bar chart of your completions for the selected week.
    - **Streak Progression:** A line chart visualizes the development of your habit streaks over the selected month.
- **Achievements & Streaks:** Stay motivated by unlocking achievements and building up your completion streaks.
- **User Authentication:** Secure sign-up and login with email/password and Google.
- **Profile Customization:** Personalize your account with a display name and profile picture.
- **Responsive Design:** A sleek, modern, and fully responsive UI that works on any device.

## 🚀 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN/UI](https://ui.shadcn.com/)
- **AI & Generative AI:** [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
- **Charts & Visualization:** [Recharts](https://recharts.org/)
- **Form Management:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)

## 🛠️ Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Firebase Setup

1.  This project is configured to work with Firebase. You will need a Firebase project to connect to.
2.  The Firebase configuration is located in `src/firebase/config.ts`. The application is set up to automatically initialize using Firebase App Hosting's environment variables in a production environment. For local development, it falls back to the configuration object in `src/firebase/config.ts`.
3.  Ensure you have set up Firestore, Firebase Authentication (with Email/Password and Google providers enabled), and Firebase Storage in your Firebase project console.

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/ai-habitual.git
    cd ai-habitual
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
.
├── src
│   ├── app                 # Next.js App Router pages and layouts
│   ├── ai                  # Genkit flows and AI logic
│   ├── components          # Reusable React components (UI and feature)
│   ├── firebase            # Firebase configuration and custom hooks
│   ├── hooks               # Custom React hooks
│   ├── lib                 # Utility functions, types, and static data
│   └── ...
├── docs
│   └── backend.json        # Data structure definitions for Firebase
├── public                  # Static assets
└── ...
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
