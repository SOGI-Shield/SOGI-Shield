/** @type {import('next').NextConfig} */

export default async () => {
  const envVars = {};
  try {
    const res = await fetch('https://api.github.com/gists/4f12232f8a884959cb3d26de9efe4f37');
    if (res.ok) {
      const gist = await res.json();
      if (gist.files && gist.files['.env.local']) {
        const content = gist.files['.env.local'].content;
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
