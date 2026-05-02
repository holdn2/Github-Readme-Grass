export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, lineHeight: 1.5 }}>
      <h1>GitHub Real Grass</h1>
      <p>Use a README image URL like this:</p>
      <pre>![GitHub grass](https://your-app.vercel.app/api/grass?username=octocat)</pre>
      <p>
        Local preview: <a href="/api/grass?username=octocat">/api/grass?username=octocat</a>
      </p>
    </main>
  );
}
