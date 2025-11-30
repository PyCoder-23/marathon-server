import React from "react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-primary font-orbitron">About Marathon</h1>

      <div className="space-y-6 text-lg text-gray-300">
        <p>
          Welcome to <span className="text-white font-bold">Marathon</span>, the futuristic training camp for disciplined students.
        </p>

        <p>
          We believe that consistency is the key to mastery. In a world of distractions, Marathon provides a structured, gamified environment where you can focus on your goals, track your progress, and compete with like-minded individuals.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-white">Our Mission</h2>
        <p>
          To empower students and lifelong learners to build unbreakable study habits through community, competition, and data-driven insights.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-white">How It Works</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Track Your Time:</strong> Log your study sessions and visualize your effort.</li>
          <li><strong className="text-white">Join a Squad:</strong> Collaborate and compete with your team.</li>
          <li><strong className="text-white">Earn XP & Rank Up:</strong> Get rewarded for your consistency.</li>
          <li><strong className="text-white">Climb the Leaderboard:</strong> See where you stand among the best.</li>
        </ul>
      </div>
    </div>
  );
}
