// src/App.js

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import './App.css';

function App() {
  // Reference to the webcam component
  const webcamRef = useRef(null);

  // State variables
  const [imageSrc, setImageSrc] = useState(null);      // Captured image source
  const [answer, setAnswer] = useState('');            // AI-generated answer
  const [loading, setLoading] = useState(false);       // Loading state
  const [error, setError] = useState('');              // Error messages

  // Function to capture the image and initiate processing
  const captureAndProcess = async () => {
    // Reset previous states
    setAnswer('');
    setError('');

    // Capture the image from the webcam
    const image = webcamRef.current.getScreenshot();
    if (!image) {
      setError('Failed to capture image. Please try again.');
      return;
    }
    setImageSrc(image);
    setLoading(true);

    try {
      // Perform OCR using Tesseract.js
      const ocrResult = await Tesseract.recognize(image, 'eng', {
        logger: (m) => console.log(m), // Optional: Log progress
      });

      const extractedText = ocrResult.data.text.trim();
      console.log('Extracted Text:', extractedText);

      if (!extractedText) {
        setError('No text detected. Please try again with a clearer image.');
        setLoading(false);
        return;
      }

      // Prepare the prompt for the backend API
      const prompt = `You are an intelligent assistant that helps answer multiple-choice questions. Below is the question and the options. Provide the correct answer (e.g., "A", "B", "C", or "D") along with a brief explanation.

${extractedText}

Answer:`;

      // Send the prompt to the backend server
      const response = await axios.post('https://quizcracker-backend.vercel.app/api/get-answer', {
        prompt: prompt,
      });

      const aiAnswer = response.data.answer;
      console.log('AI Answer:', aiAnswer);
      setAnswer(aiAnswer);
    } catch (err) {
      console.error('Error during processing:', err.response?.data || err.message);
      setError('An error occurred while processing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to retake the photo
  const retakePhoto = () => {
    setImageSrc(null);
    setAnswer('');
    setError('');
  };

  return (
    <div className="App">
      <h1>MCQ Quiz Helper</h1>

      {/* Webcam or Captured Image Display */}
      {!imageSrc ? (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={320}
          height={240}
          videoConstraints={{
            facingMode: 'environment', // Use the rear camera if available
          }}
        />
      ) : (
        <div className="captured-image-container">
          <img src={imageSrc} alt="Captured" width={320} height={240} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="button-container">
        {!imageSrc ? (
          <button onClick={captureAndProcess}>Capture & Get Answer</button>
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

      {/* Display Extracted Text (Optional) */}
      {/* Uncomment the following block if you want to display the extracted text
      {extractedText && (
        <div className="extracted-text-container">
          <h2>Extracted Text:</h2>
          <pre>{extractedText}</pre>
        </div>
      )} 
      */}

      {/* Display Answer or Error */}
      {answer && (
        <div className="answer-container">
          <h2>Answer:</h2>
          <p>{answer}</p>
        </div>
      )}

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
