"use client";

import { useState, useEffect, useCallback } from 'react';
import { words } from '@/data/words';
import { Word } from '@/types';

export default function Home() {
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [sentence, setSentence] = useState<string>('');
    const [score, setScore] = useState<number | null>(null);
    const [feedbackColor, setFeedbackColor] = useState<string>('text-gray-700');
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [suggestion, setSuggestion] = useState<string>('');

    const getRandomWord = useCallback(async () => {
        const respond = await fetch("http://localhost:8000/api/word");
        const data = await respond.json();

        setCurrentWord(data);
        setSentence('');
        setScore(null);
        setFeedbackColor('text-gray-700');
        setSuggestion('');
        setIsSubmitted(false);
    }, []);

    useEffect(() => {
        getRandomWord();
    }, [getRandomWord]);

    const handleSentenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSentence(e.target.value);
        if (isSubmitted) {
            setScore(null);
            setFeedbackColor('text-gray-700');
            setSuggestion('');
            setIsSubmitted(false);
        }
    };

    const handleSubmitSentence = async () => {
        if (!currentWord) return;

        try {
            const res = await fetch("http://localhost:8000/api/practice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: 1,
                    word_id: currentWord.id,
                    submitted_sentence: sentence,
                }),
            });

            const data = await res.json();
            console.log("API response:", data);

            const newScore = parseFloat(data.score);
            setScore(isNaN(newScore) ? 0 : newScore);
            setSuggestion(data.suggestion || '');

            if (newScore >= 8.0) {
                setFeedbackColor("text-success");
            } else if (newScore >= 6.0) {
                setFeedbackColor("text-warning");
            } else {
                setFeedbackColor("text-danger");
            }

            // Save history
            const history = JSON.parse(localStorage.getItem("wordHistory") || "[]");
            history.push({
                word: currentWord.word,
                sentence: sentence,
                score: newScore,
                difficulty: currentWord.difficulty_level,
                suggestion: data.suggestion || '',
                timestamp: new Date().toISOString(),
            });
            localStorage.setItem("wordHistory", JSON.stringify(history));

            setIsSubmitted(true);

        } catch (error) {
            console.error("Error validating sentence:", error);
            alert("API Error: cannot validate sentence");
        }
    };

    const handleNextWord = () => {
        getRandomWord();
    };

    const getDifficultyColor = (difficulty_level: string) => {
        switch (difficulty_level) {
            case "Beginner":
                return "bg-green-200 text-green-800";
            case "Intermediate":
                return "bg-yellow-200 text-yellow-800";
            case "Advanced":
                return "bg-red-200 text-red-800";
            default:
                return "bg-gray-200 text-gray-800";
        }
    };

    if (!currentWord) {
        return <div className="flex justify-center items-center h-screen">Loading word...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 text-gray-800 leading-tight">Word Challenge</h1>

            <div className="bg-white p-8 rounded-2xl shadow-xl mb-6 border border-gray-100 transform hover:scale-105 transition-transform duration-300 ease-in-out">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2 sm:mb-0">{currentWord.word}</h2>
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(currentWord.difficulty_level)} shadow-md`}>
                        {currentWord.difficulty_level}
                    </span>
                </div>
                <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed">{currentWord.definition}</p>

                <div className="mb-6">
                    <label htmlFor="sentence" className="block text-base font-medium text-gray-700 mb-2">Your Sentence:</label>
                    <textarea
                        id="sentence"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-200 ease-in-out resize-y text-lg"
                        rows={4}
                        placeholder="Type your sentence here..."
                        value={sentence}
                        onChange={handleSentenceChange}
                        disabled={isSubmitted}
                    ></textarea>
                </div>

                {isSubmitted && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xl font-semibold mb-2">Score: <span className={`${feedbackColor}`}>{score?.toFixed(1)}</span></p>
                        <p className="text-gray-700">Suggestion: {suggestion}</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                    <div className="flex space-x-3">
                        {!isSubmitted ? (
                            <button
                                onClick={handleSubmitSentence}
                                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition duration-200 ease-in-out font-medium shadow-md"
                                disabled={!sentence.trim()}
                            >
                                Submit Sentence
                            </button>
                        ) : (
                            <button
                                onClick={handleNextWord}
                                className="px-6 py-3 bg-info text-white rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out font-medium shadow-md"
                            >
                                Next Word
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
