import React, { useState } from 'react';
import './App.css';

function App() {
  
  const [transcript, setTranscript] = useState('');
  const [prompt, setPrompt] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(''); // 'success', 'error', or ''

  const handleGenerateSummary=async()=>{
    setIsLoading(true);
    setSummary('');

    try{
      const response=await fetch(
        'http://localhost:3000/api/summary',
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            transcript,prompt
          })
        })
        if(!response.ok){
          throw new Error(`HTTP error Status :${response.status}`)
        }

        const data=await response.json();
        setSummary(data.sum);

    }
    catch(error){
      console.log('error generate summary ',error);
      setSummary('failed to generate summary . check console')
    }
    finally{
      setIsLoading(false);
    }
  }

  
  const handleShareEmail = async () => {
    if (!recipientEmail || !summary) {
      alert("Please generate a summary and provide a recipient's email.");
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus('');

    try {
      const response = await fetch('http://localhost:3000/api/share-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: summary,
          email: recipientEmail, // The backend expects 'email'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEmailStatus('success');
    } catch (error) {
      console.error("Error sharing email:", error);
      setEmailStatus('error');
    } finally {
      setIsSendingEmail(false);
      // Clear the status message after a few seconds
      setTimeout(() => setEmailStatus(''), 5000);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Meeting Summary</h1>
      </header>
      <main>
        <div className="form-container">
          <form onSubmit={(e) => { e.preventDefault(); handleGenerateSummary(); }}>
            <div className="form-group">
              <label htmlFor="transcript">Transcript</label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting transcript here..."
                rows="15"
              />
            </div>
            <div className="form-group">
              <label htmlFor="prompt">Prompt</label>
              <input
                type="text"
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Summarize the key decisions and action items.'"
              />
            </div>
            <button type="submit" disabled={isLoading || !transcript}>
              {isLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          </form>
        </div>

        <div className="summary-container">
          <h2>Summary</h2>
          <div
            className="summary-content"
            contentEditable={!isLoading && !!summary}
            // This handler updates the summary state whenever the user edits the content.
            onInput={(e) => setSummary(e.currentTarget.textContent || '')}
            suppressContentEditableWarning={true}
          >
            {summary || "The generated summary will appear here."}
          </div>
        </div>

        {/* This section only appears after a summary has been generated */}
        {summary && (
          <div className="share-container">
            <h3>Share Summary</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleShareEmail(); }}>
              <div className="form-group">
                <label htmlFor="email">Recipient's Email</label>
                <input
                  type="email"
                  id="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <button type="submit" disabled={isSendingEmail || !recipientEmail}>
                {isSendingEmail ? 'Sending...' : 'Share via Email'}
              </button>
            </form>
            {emailStatus && (
              <p className={`email-status ${emailStatus}`}>
                {emailStatus === 'success' ? 'Summary sent successfully!' : 'Failed to send email.'}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
