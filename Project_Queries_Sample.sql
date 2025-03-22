-- Queries

-- Get all posts along with user information (Join)
SELECT p.PID, p.Content, p.Date, u.Username, u.Email 
FROM Posts p 
JOIN Users u ON p.UID = u.UID;

-- Find the number of posts per user (Aggregation and Group By)
SELECT UID, COUNT(*) AS TotalPosts 
FROM Posts 
GROUP BY UID;

-- Get the top 5 most liked posts (Aggregation and Ordering)
SELECT PID, Content, Likes 
FROM Posts 
ORDER BY Likes DESC 
LIMIT 5;

-- Fetch all users who have reported a post with a specific reason
SELECT DISTINCT u.Username, r.Reason, r.Date 
FROM Reports r 
JOIN Users u ON r.UID = u.UID 
WHERE r.Reason = 'Hate speech';

-- Find mutual friends (Self Join)
SELECT f1.UID1 AS User1, f1.UID2 AS User2 
FROM Friends f1 
JOIN Friends f2 ON f1.UID2 = f2.UID1 AND f1.UID1 = f2.UID2;

-- Get users who have never posted (Subquery and NOT EXISTS)
SELECT u.Username 
FROM Users u 
WHERE NOT EXISTS (SELECT 1 FROM Posts p WHERE p.UID = u.UID);

-- Find the most active users based on total interactions (Likes, Comments, Shares, Posts)
SELECT u.Username, 
       (SELECT COUNT(*) FROM Posts p WHERE p.UID = u.UID) + 
       (SELECT COUNT(*) FROM Likes l WHERE l.UID = u.UID) + 
       (SELECT COUNT(*) FROM Comments c WHERE c.UID = u.UID) AS TotalInteractions
FROM Users u 
ORDER BY TotalInteractions DESC 
LIMIT 5;

-- Get the total number of reports made against each post
SELECT r.PID, COUNT(r.UID) AS ReportCount 
FROM Reports r 
GROUP BY r.PID 
ORDER BY ReportCount DESC;

-- Get a list of banned users and the admins who banned them
SELECT u.Username, b.Date, b.Reason, a.AID 
FROM Banned b 
JOIN Users u ON b.UID = u.UID 
JOIN Admins a ON b.AID = a.AID;

-- Retrieve all posts along with the number of comments per post
SELECT p.PID, p.Content, COUNT(c.UID) AS CommentCount
FROM Posts p 
LEFT JOIN Comments c ON p.PID = c.PID 
GROUP BY p.PID;

-- Fetch the latest 10 messages exchanged between two users
SELECT * 
FROM Messages 
WHERE (UID1 = 1 AND UID2 = 2) OR (UID1 = 2 AND UID2 = 1) 
ORDER BY Date DESC 
LIMIT 10;

-- Get the top 3 most followed users 
SELECT UID2 AS MostFollowedUser, COUNT(UID1) AS FollowersCount 
FROM Follows 
GROUP BY UID2 
ORDER BY FollowersCount DESC 
LIMIT 3;

-- Find users who liked and commented on the same post 
SELECT DISTINCT l.UID 
FROM Likes l 
JOIN Comments c ON l.UID = c.UID AND l.PID = c.PID;

-- Get the number of posts removed by each admin 
SELECT a.AID, COUNT(rp.PID) AS RemovedPostsCount 
FROM Removed_Posts rp 
JOIN Admins a ON rp.AID = a.AID 
GROUP BY a.AID;
