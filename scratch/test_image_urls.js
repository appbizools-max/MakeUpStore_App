const https = require('https');

const urls = [
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/icon_cat_7.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/icon_cat_8.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/icon_cat_9.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/icon_cat_11.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/icon_cat_fragrance.png',
  'https://mlhlpslhrvwjasbttghw.supabase.co/storage/v1/object/public/categories/icon_cat_hair_styling.png'
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(url.split('/').pop(), 'Status:', res.statusCode, 'Content-Type:', res.headers['content-type'], 'Content-Length:', res.headers['content-length']);
  }).on('error', (e) => {
    console.error(url, e.message);
  });
});

