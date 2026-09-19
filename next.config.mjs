/** @type {import('next').NextConfig} */

export default async () => {
  const envVars = {};
  try {
    const res = await fetch('https://gist.githubusercontent.com/Shubham-hahh/4f12232f8a884959cb3d26de9efe4f37/raw');
    if (res.ok) {
      const content = await res.text();
      if (content) {
        content.split('\n').forEach(line => {
          const match = line.match(/^([^=]+)=(.*)$/);
          if (match && !line.trim().startsWith('#')) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, '');
            envVars[key] = value;
            process.env[key] = value;
          }
        });
        console.log('✅ Successfully loaded environment variables from Gist');
      }
    } else {
      console.error('❌ Failed to fetch environment variables from Gist:', res.statusText);
    }
  } catch (error) {
    console.error('❌ Failed to fetch environment variables from Gist:', error.message);
  }

  const nextConfig = {
    env: envVars,
  };
  
  return nextConfig;
};
