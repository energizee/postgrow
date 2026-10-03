import { useState, useEffect } from 'react';

export function HouseholdPage() {
  const [username, setUsername] = useState('');
  const [postcode, setPostcode] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  //Check if a user already exists in local storage when the page loads
  useEffect(() => {
    const savedProfile = localStorage.getItem('ecoProfile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUsername(parsedProfile.username);
      setPostcode(parsedProfile.postcode);
    }
  }, []);

  //Handle form submission
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); //Prevents the page from refreshing

    const formattedPostcode = postcode.trim().slice(0, -2);

    const profileData = {
      username: username,
      postcode: formattedPostcode.toUpperCase(), //Standardize postcodes
      score: 0 // Initialize their eco-score at 0 for later
    };

    //Save to the browser's local storage as a string
    localStorage.setItem('ecoProfile', JSON.stringify(profileData));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); //Hide success message after 3 seconds
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h2>Join the Eco Competition</h2>
      <p>Enter your details to start earning points for your postcode</p>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Enter your Postcode (e.g., ML3 7NF)</label>
          <input 
            type="text" 
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ padding: '0.75rem', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Save Profile
        </button>
      </form>

      {isSaved && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e9', color: '#2e7d32' }}>
         Profile saved successfully! Ready to earn points.
        </div>
      )}
    </div>
  );
}