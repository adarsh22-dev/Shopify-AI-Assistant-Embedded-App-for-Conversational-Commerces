(function() {
  const APP_URL = "https://ais-dev-bnbrppid6fcrffestyahpq-48572307059.asia-east1.run.app"; // This will be updated to the production Vercel URL
  
  // Load CSS from the app
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${APP_URL}/assets/index.css`;
  document.head.appendChild(link);

  // Load JS from the app
  const script = document.createElement('script');
  script.type = 'module';
  script.src = `${APP_URL}/assets/index.js`;
  document.body.appendChild(script);
  
  console.log("CISAI Chat Integrated - Design by Adarsh Singh");
})();
