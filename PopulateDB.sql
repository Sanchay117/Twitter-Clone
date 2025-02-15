--                                      --------Users Table----------

INSERT INTO Users (Username, Email, Password, DOB) 
VALUES ('john_doe', 'john.doe@example.com', 'password123', '1990-05-15');

INSERT INTO Users (Username, Email, Password, DOB, Bio) 
VALUES ('jane_smith', 'jane.smith@example.com', 'securePass456', '1988-11-22', 'Avid reader and coffee enthusiast.');

INSERT INTO Users (Username, Email, Password, DOB, Bio) 
VALUES ('alice_j', 'alice.j@example.com', 'alicePass789', '1995-03-10', 'Music lover and tech geek.');

INSERT INTO Users (Username, Email, Password, DOB, Bio) 
VALUES ('michael_b', 'michael.b@example.com', 'mikeStrongPwd', '1992-08-30', 'Sports fanatic and traveler.');

INSERT INTO Users (Username, Email, Password, DOB) 
VALUES ('sarah_lee', 'sarah.lee@example.com', 'sarahSecret123', '1998-01-14');

INSERT INTO Users (Username, Email, Password, DOB, Bio) 
VALUES ('david_k', 'david.k@example.com', 'davidPassword321', '1985-06-25', 'Gamer and comic book collector.');

INSERT INTO Users (Username, Email, Password, DOB) 
VALUES ('emily_w', 'emily.w@example.com', 'emilyPwd654', '1993-09-19');
 
--                                      ---------Posts Table----------

INSERT INTO Posts (Content, UID) 
VALUES ('Exploring the mountains today!', 1);

INSERT INTO Posts (Content, UID) 
VALUES ('Just finished an amazing book. Highly recommend!', 2);

INSERT INTO Posts (Content, UID) 
VALUES ('Listening to my favorite band on repeat.', 3);

INSERT INTO Posts (Content, UID) 
VALUES ('Had a great workout session!', 4);

INSERT INTO Posts (Content, UID) 
VALUES ('Trying out a new recipe tonight.', 5);

INSERT INTO Posts (Content, UID) 
VALUES ('Game night with friends!', 6);

INSERT INTO Posts (Content, UID) 
VALUES ('Meditation is the key to a peaceful mind.', 7);

INSERT INTO Posts (Content, UID) 
VALUES ('Sunsets at the beach are breathtaking.', 1);

INSERT INTO Posts (Content, UID) 
VALUES ('Book recommendations, anyone?', 2);

INSERT INTO Posts (Content, UID) 
VALUES ('New tech gadgets are so exciting!', 3);

INSERT INTO Posts (Content, UID) 
VALUES ('Just ran my first marathon!', 4);

INSERT INTO Posts (Content, UID) 
VALUES ('Baking cookies for the weekend.', 5);

INSERT INTO Posts (Content, UID) 
VALUES ('Completed my comic book collection!', 6);

INSERT INTO Posts (Content, UID) 
VALUES ('Feeling grateful today.', 7);

INSERT INTO Posts (Content, UID) 
VALUES ('Exploring new music genres.', 1);

--                                      ---------Admins Table----------

INSERT INTO Admins (Password) 
VALUES ('adminPass123');

INSERT INTO Admins (Password) 
VALUES ('secureAdmin456');

INSERT INTO Admins (Password) 
VALUES ('masterKey789');

INSERT INTO Admins (Password) 
VALUES ('rootAccess321');

INSERT INTO Admins (Password) 
VALUES ('superUser654');

INSERT INTO Admins (Password) 
VALUES ('adminSecret999');

INSERT INTO Admins (Password) 
VALUES ('controlPanel000');

--                                      ---------comments Table----------

INSERT INTO Comments (Content, UID, PID) 
VALUES ('Great post!', 1, 3);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('I completely agree!', 2, 4);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('Thanks for sharing!', 3, 5);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('Interesting perspective.', 4, 6);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('I learned something new today.', 5, 7);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('Could you elaborate on this?', 6, 8);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('This is so relatable!', 7, 9);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('I have a different opinion on this.', 1, 10);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('Well written!', 2, 11);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('Looking forward to more posts like this.', 3, 12);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('I disagree, but respect your view.', 4, 13);

INSERT INTO Comments (Content, UID, PID) 
VALUES ('This made my day!', 5, 14);


--                                      ---------Follows Table----------

INSERT INTO Follows (UID1, UID2) 
VALUES (1, 2);

INSERT INTO Follows (UID1, UID2) 
VALUES (2, 3);

INSERT INTO Follows (UID1, UID2) 
VALUES (3, 4);

INSERT INTO Follows (UID1, UID2) 
VALUES (4, 5);


--                                      ---------Friends Table----------

INSERT INTO Friends (UID1, UID2) 
VALUES (1, 3);

INSERT INTO Friends (UID1, UID2) 
VALUES (2, 4);

INSERT INTO Friends (UID1, UID2) 
VALUES (3, 5);

INSERT INTO Friends (UID1, UID2) 
VALUES (4, 6);

INSERT INTO Friends (UID1, UID2) 
VALUES (5, 7);


--                                      ---------Messages Table----------

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (1, 2, 'Hey, how are you?');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (2, 1, 'I am good, thanks! How about you?');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (3, 4, 'Are you coming to the event tomorrow?');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (4, 3, 'Yes, I will be there!');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (5, 6, 'Did you finish the assignment?');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (6, 5, 'Not yet, still working on it.');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (7, 1, 'Happy Birthday!');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (1, 7, 'Thank you!');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (2, 3, 'Long time no see!');

INSERT INTO Messages (UID1, UID2, Content) 
VALUES (3, 2, 'Yeah! We should catch up soon.');

--                                      ---------Notifications Table----------

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (2, 1, 'Like', 3, 'john_doe liked your post.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (3, 2, 'Comment', 4, 'jane_smith commented on your post.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (5, 4, 'Like', 6, 'michael_b liked your post.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (6, 5, 'Follow', 1, 'sarah_lee started following you.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (7, 6, 'Comment', 7, 'david_k commented on your post.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (1, 7, 'Follow', 8, 'emily_w started following you.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (3, 4, 'Like', 10, 'michael_b liked your post.');

INSERT INTO Notification (UID, SID, Type, PID, Content) 
VALUES (4, 5, 'Comment', 11, 'sarah_lee commented on your post.');


--                                      ---------Likes Table----------

INSERT INTO Likes (UID, PID) 
VALUES (1, 3);

INSERT INTO Likes (UID, PID) 
VALUES (2, 4);

INSERT INTO Likes (UID, PID) 
VALUES (3, 5);

INSERT INTO Likes (UID, PID) 
VALUES (4, 6);

INSERT INTO Likes (UID, PID) 
VALUES (5, 7);

INSERT INTO Likes (UID, PID) 
VALUES (6, 8);

INSERT INTO Likes (UID, PID) 
VALUES (7, 9);

INSERT INTO Likes (UID, PID) 
VALUES (1, 10);

INSERT INTO Likes (UID, PID) 
VALUES (2, 11);

INSERT INTO Likes (UID, PID) 
VALUES (3, 12);

--                                      ---------Reports Table----------

INSERT INTO Reports (UID, PID, Reason) 
VALUES (1, 4, 'Inappropriate content');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (2, 5, 'Spam');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (3, 6, 'Harassment');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (4, 7, 'False information');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (5, 8, 'Copyright violation');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (6, 9, 'Hate speech');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (7, 10, 'Misleading content');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (1, 11, 'Offensive language');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (2, 12, 'Privacy violation');

INSERT INTO Reports (UID, PID, Reason) 
VALUES (3, 13, 'Scam or fraud');

--                                      ---------Currently Banned Table----------

INSERT INTO Banned (Reason, UID, AID) 
VALUES ('Violation of community guidelines', 3, 1);

INSERT INTO Banned (Reason, UID, AID) 
VALUES ('Spamming inappropriate content', 5, 2);

INSERT INTO Banned (Reason, UID, AID) 
VALUES ('Harassment and abusive behavior', 7, 3);


--                                      ---------Removed Posts Table----------

INSERT INTO Removed_Posts (PID, AID, Reason) 
VALUES (2, 1, 'Inappropriate language used.');

INSERT INTO Removed_Posts (PID, AID, Reason) 
VALUES (4, 2, 'Violation of community guidelines.');

INSERT INTO Removed_Posts (PID, AID, Reason) 
VALUES (6, 3, 'Spam content detected.');

INSERT INTO Removed_Posts (PID, AID, Reason) 
VALUES (9, 4, 'Misinformation spread.');

INSERT INTO Removed_Posts (PID, AID, Reason) 
VALUES (11, 5, 'Harassment and abusive comments.');
