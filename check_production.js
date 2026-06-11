async function checkProd() {
  try {
    const res = await fetch('https://culturequest.vip/api/videos/feed?feed=recent&limit=100');
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body preview:", text.substring(0, 1000));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProd();
