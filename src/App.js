// src/App.js

import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import './App.css';

function App() {
  const fileInputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);      // Captured image source
  const [answer, setAnswer] = useState('');            // AI-generated answer
  const [loading, setLoading] = useState(false);       // Loading state
  const [error, setError] = useState('');              // Error messages

  // Function to handle the button click and trigger file input
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle the file input change (image captured)
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setError('');
      setAnswer('');
      setImageSrc(URL.createObjectURL(file));
      setLoading(true);

      try {
        // Convert image file to base64
        const base64Image = await convertToBase64(file);

        // Perform OCR using Tesseract.js
        const ocrResult = await Tesseract.recognize(base64Image, 'eng', {
          logger: (m) => console.log(m), // Optional: Log progress
        });

        const extractedText = ocrResult.data.text.trim();
        console.log('Extracted Text:', extractedText);

        if (!extractedText) {
          setError('No text detected. Please try again with a clearer image.');
          setLoading(false);
          return;
        }

        // Prepare the request payload for the backend
        const payload = {
          question_text: extractedText
        };

        // Call the backend API to get the answer
        const response = await axios.post('https://quizcracker-backend.vercel.app/api/get-answer', payload);

        const aiAnswer = response.data.answer;
        console.log('AI Answer:', aiAnswer);
        setAnswer(aiAnswer);
      } catch (err) {
        console.error('Error during processing:', err.response?.data || err.message);
        setError('An error occurred while processing. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Utility function to convert image file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Function to retake the photo
  const retakePhoto = () => {
    setImageSrc(null);
    setAnswer('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  return (
    <div className="App">
      <h1>MCQ Quiz Helper</h1>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Display Captured Image */}
      {imageSrc && (
        <div className="captured-image-container">
          <img src={imageSrc} alt="Captured" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="button-container">
        {!imageSrc ? (
          <button onClick={handleButtonClick}>Take Photo & Get Answer</button>
        ) : (
          <button onClick={retakePhoto}>Retake Photo</button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="loading-container">
          <ClipLoader size={50} color="#123abc" loading={loading} />
          <p>Processing...</p>
        </div>
      )}

      {/* Display Answer */}
      {answer && (
        <div className="answer-container">
          <h2>Answer:</h2>
          <p>{answer}</p>
        </div>
      )}

      {/* Display Error */}
      {error && (
        <div className="error-container">
          <h2>Error:</h2>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default App;
