const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err));

const blogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
});

const rankingSchema = new mongoose.Schema({
  blog_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  rank: { type: Number, required: true, min: 1, max: 100 },
});

const Blog = mongoose.model('Blog', blogSchema);
const Ranking = mongoose.model('Ranking', rankingSchema);

app.use(express.json());

app.get('/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().exec();
    const rankedBlogs = await Promise.all(
      blogs.map(async (blog) => {
        const rankData = await Ranking.findOne({ blog_id: blog._id }).exec();
        return { ...blog.toObject(), rank: rankData ? rankData.rank : null };
      })
    );

    rankedBlogs.sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity));

    res.json({ totalBlogs: rankedBlogs.length, blogs: rankedBlogs });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, async () => {
  try {
    await Blog.deleteMany({}); // Clear existing data

    // Define the predefined data
    const predefinedBlogs = [
      {
        name: 'Blog 1',
        content: 'This is the content of Blog 1.',
        author: 'Author 1',
        views: 100,
        likes: 50,
      },
      {
        name: 'Blog 2',
        content: 'This is the content of Blog 2.',
        author: 'Author 2',
        views: 80,
        likes: 70,
      },
      // Add more predefined blogs as needed
    ];

    // Insert the predefined data into MongoDB
    await Blog.insertMany(predefinedBlogs);

    console.log('Predefined data inserted successfully.');
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Error inserting predefined data or starting server:', error);
  }
});
