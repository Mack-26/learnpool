-- =============================================================================
-- LearnPool — Development Seed Data
-- Run with: make db-seed
--
-- Seed users password: devpassword
-- Uses pgcrypto's crypt() to generate real bcrypt hashes at insert time.
-- =============================================================================

-- Truncate in reverse dependency order so this script is safely re-runnable.
TRUNCATE TABLE
    answer_feedback,
    answer_citations,
    answers,
    questions,
    session_documents,
    sessions,
    document_chunks,
    documents,
    course_enrollments,
    courses,
    users
CASCADE;


-- =============================================================================
-- USERS  (1 professor + 8 students)
-- =============================================================================

INSERT INTO users (id, email, password_hash, display_name, role) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'prof@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Dr. Smith',
        'professor'
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'alice@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Alice Johnson',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'bob@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Bob Chen',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        'carol@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Carol Davies',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000005',
        'dave@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Dave Kim',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000006',
        'emma@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Emma Watson',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000007',
        'frank@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Frank Garcia',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000008',
        'grace@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Grace Lee',
        'student'
    ),
    (
        '00000000-0000-0000-0000-000000000009',
        'henry@example.com',
        crypt('devpassword', gen_salt('bf', 12)),
        'Henry Patel',
        'student'
    );


-- =============================================================================
-- COURSE + ENROLLMENTS
-- =============================================================================

INSERT INTO courses (id, professor_id, name, description) VALUES
    (
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'Introduction to Machine Learning',
        'Core concepts: supervised learning, neural networks, model evaluation.'
    );

INSERT INTO course_enrollments (course_id, student_id) VALUES
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000003'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000005'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000006'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000007'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000008'),
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009');


-- =============================================================================
-- SESSIONS
-- =============================================================================

INSERT INTO sessions (id, course_id, title, status, started_at, ended_at) VALUES
    (
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000010',
        'Lecture 1 — Linear Regression',
        'released',
        now() - interval '7 days',
        now() - interval '7 days' + interval '90 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000010',
        'Lecture 2 — Gradient Descent',
        'active',
        now(),
        NULL
    ),
    (
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000010',
        'Lecture 7 — Images as Graphs',
        'released',
        now() - interval '2 days',
        now() - interval '2 days' + interval '75 minutes'
    );


-- =============================================================================
-- DOCUMENTS
-- =============================================================================

INSERT INTO documents (id, course_id, uploaded_by, filename, storage_path, processing_status, page_count, file_size_bytes, processed_at) VALUES
    (
        '00000000-0000-0000-0000-000000000030',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'lecture1_linear_regression.pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/lecture1_linear_regression.pdf',
        'ready', 22, 1048576, now() - interval '7 days'
    ),
    (
        '00000000-0000-0000-0000-000000000031',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'lecture2_gradient_descent.pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/lecture2_gradient_descent.pdf',
        'ready', 18, 819200, now() - interval '1 day'
    ),
    (
        '00000000-0000-0000-0000-000000000032',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        'textbook_chapter3.pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/textbook_chapter3.pdf',
        'uploaded', NULL, 5242880, NULL
    ),
    (
        '00000000-0000-0000-0000-000000000033',
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000001',
        '07 Images as Graphs SUPP (1).pdf',
        'courses/00000000-0000-0000-0000-000000000010/docs/07_images_as_graphs.pdf',
        'ready', 21, 2097152, now() - interval '3 days'
    );


-- =============================================================================
-- SESSION DOCUMENTS
-- =============================================================================

INSERT INTO session_documents (session_id, document_id, is_active) VALUES
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000030', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000031', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000032', false),
    ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000033', true);


-- =============================================================================
-- DOCUMENT CHUNKS  (embeddings NULL — run embed_seed_chunks.py to populate)
-- =============================================================================

INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count) VALUES
    -- Linear Regression doc
    (
        '00000000-0000-0000-0000-000000000040',
        '00000000-0000-0000-0000-000000000030', 0, 1,
        'Linear regression is a supervised learning algorithm that models the relationship between a dependent variable and one or more independent variables by fitting a linear equation to observed data. Simple linear regression uses one predictor, while multiple linear regression uses two or more.',
        52
    ),
    (
        '00000000-0000-0000-0000-000000000041',
        '00000000-0000-0000-0000-000000000030', 1, 2,
        'The cost function for linear regression is the Mean Squared Error (MSE): J(θ) = (1/2m) Σ(h(x) - y)². Errors are squared for two reasons: to make all errors positive so they do not cancel each other out, and to penalise large deviations more than small ones.',
        56
    ),
    (
        '00000000-0000-0000-0000-000000000042',
        '00000000-0000-0000-0000-000000000031', 0, 1,
        'Gradient descent is an optimization algorithm that iteratively adjusts model parameters in the direction of steepest descent of the loss function, scaled by a learning rate α. A learning rate that is too high causes divergence; one that is too small leads to very slow convergence.',
        51
    ),
    (
        '00000000-0000-0000-0000-000000000043',
        '00000000-0000-0000-0000-000000000030', 2, 4,
        'R-squared (R²) measures the proportion of variance in the dependent variable explained by the model, ranging from 0 to 1. R² = 1 − (SS_res / SS_tot). A value close to 1 indicates a strong fit; a value near 0 suggests the model explains little variance. R² can increase artificially when more predictors are added, so adjusted R² is preferred for multiple regression.',
        75
    ),
    (
        '00000000-0000-0000-0000-000000000044',
        '00000000-0000-0000-0000-000000000030', 3, 6,
        'Overfitting occurs when a model learns the training data too well, including noise, and therefore generalises poorly to new data. In linear regression, overfitting is controlled using regularisation techniques such as Ridge (L2) and Lasso (L1) regression, which add a penalty term to the cost function based on the magnitude of the coefficients.',
        65
    ),
    (
        '00000000-0000-0000-0000-000000000045',
        '00000000-0000-0000-0000-000000000031', 1, 3,
        'Gradient descent converges when successive updates to the parameters produce negligibly small changes, i.e., ||θ_new − θ_old|| < ε. In practice, convergence is monitored by plotting the loss curve. Stochastic Gradient Descent (SGD) updates parameters using one sample at a time and introduces noise that can help escape local minima, whereas Batch GD uses the full dataset per step.',
        72
    ),
    (
        '00000000-0000-0000-0000-000000000046',
        '00000000-0000-0000-0000-000000000031', 2, 5,
        'Local minima in non-convex loss functions can trap gradient descent. For convex problems like linear regression with MSE, there is only a single global minimum, so gradient descent always converges to the optimal solution. Saddle points (zero gradient in some directions) are more common in deep learning but rarely a practical problem for first-order methods.',
        68
    ),

    -- Images as Graphs doc chunks
    (
        '00000000-0000-0000-0000-000000000047',
        '00000000-0000-0000-0000-000000000033', 0, 1,
        'An image can be represented as a graph where each pixel is a node and edges connect neighbouring pixels. The weight of an edge reflects the similarity between the two pixels it connects — similar pixels have high-weight edges, dissimilar pixels have low-weight edges. This graph representation enables us to apply graph-theoretic algorithms to image segmentation and analysis.',
        68
    ),
    (
        '00000000-0000-0000-0000-000000000048',
        '00000000-0000-0000-0000-000000000033', 1, 2,
        'Image segmentation can be formulated as a graph-cut problem. Given an image graph G = (V, E), we seek a partition of V into disjoint sets (segments) such that edges within segments have high weights (similar pixels) and edges between segments have low weights (dissimilar pixels). The minimum cut of a graph finds the partition that minimises the total weight of edges between segments.',
        72
    ),
    (
        '00000000-0000-0000-0000-000000000049',
        '00000000-0000-0000-0000-000000000033', 2, 4,
        'The Normalised Cut (NCut) criterion was introduced by Shi & Malik (2000) to address the bias of minimum cut towards isolating small groups of pixels. NCut normalises the cut cost by the total edge connections from each segment to the entire graph: NCut(A,B) = cut(A,B)/assoc(A,V) + cut(A,B)/assoc(B,V). This encourages balanced partitions where segments are roughly equal in size.',
        80
    ),
    (
        '00000000-0000-0000-0000-000000000050',
        '00000000-0000-0000-0000-000000000033', 3, 6,
        'The affinity matrix W encodes pairwise similarities between pixels. A common choice is the Gaussian kernel: W_ij = exp(-||F_i - F_j||² / σ²) for neighbouring pixels i and j, where F_i is the feature vector (e.g., intensity, colour, texture) at pixel i. The parameter σ controls the scale of the similarity — smaller σ means only very similar pixels are connected strongly.',
        78
    ),
    (
        '00000000-0000-0000-0000-000000000051',
        '00000000-0000-0000-0000-000000000033', 4, 8,
        'Spectral clustering solves the normalised cut problem by relaxing the discrete assignment to a continuous eigenvalue problem. We compute the Laplacian L = D - W (where D is the degree matrix), then solve the generalised eigenvalue problem Ly = λDy. The second smallest eigenvector (Fiedler vector) provides a soft segmentation — thresholding it gives a binary partition of the image.',
        75
    ),
    (
        '00000000-0000-0000-0000-000000000052',
        '00000000-0000-0000-0000-000000000033', 5, 10,
        'Multi-scale segmentation uses multiple eigenvectors simultaneously. The k smallest eigenvectors of the normalised Laplacian embed each pixel into a k-dimensional space. Applying k-means clustering in this embedding space yields k segments. Increasing k produces finer segmentations; decreasing k produces coarser groupings. The choice of k depends on the level of detail desired in the segmentation.',
        74
    ),
    (
        '00000000-0000-0000-0000-000000000053',
        '00000000-0000-0000-0000-000000000033', 6, 12,
        'The graph Laplacian has deep connections to diffusion processes. Random walks on the image graph model how information spreads between pixels. The commute time between two nodes — the expected number of steps for a random walker to go from node i to node j and back — is related to the effective resistance in an electrical network interpretation of the graph and can be computed from the eigenvalues of the Laplacian.',
        76
    ),
    (
        '00000000-0000-0000-0000-000000000054',
        '00000000-0000-0000-0000-000000000033', 7, 14,
        'Efficient graph construction is critical for large images. A fully connected graph on an N-pixel image has O(N²) edges, which is impractical. Common approximations include k-nearest neighbour graphs (connect each pixel to its k most similar neighbours) and ε-neighbourhood graphs (connect pixels within distance ε). Spatial locality is often exploited — only pixels within a small window are considered as potential neighbours.',
        82
    ),
    (
        '00000000-0000-0000-0000-000000000055',
        '00000000-0000-0000-0000-000000000033', 8, 16,
        'GrabCut extends graph cuts for interactive segmentation. The user provides a rough bounding box around the foreground object. Gaussian Mixture Models (GMMs) are fitted to the foreground and background pixel distributions. An energy function combining data terms (how well a pixel fits the foreground/background GMM) and smoothness terms (neighbouring pixels should have the same label) is minimised via graph cuts iteratively.',
        80
    ),
    (
        '00000000-0000-0000-0000-000000000056',
        '00000000-0000-0000-0000-000000000033', 9, 18,
        'Superpixels are an over-segmentation of the image into small, roughly uniform regions. Algorithms like SLIC (Simple Linear Iterative Clustering) group pixels based on colour similarity and spatial proximity using a modified k-means algorithm. Superpixels reduce the number of graph nodes from millions of pixels to thousands of regions, making subsequent graph-based algorithms much more efficient.',
        72
    );


-- =============================================================================
-- QUESTIONS + ANSWERS + CITATIONS
-- Session 1 (Linear Regression — released): 3 topics × many students
-- Session 2 (Gradient Descent — active):   3 topics × several students
-- Session 3 (Images as Graphs — released): 5 topics × many students
-- =============================================================================

-- ── Session 1 questions ─────────────────────────────────────────────────────

-- TOPIC A: Simple vs Multiple Regression
INSERT INTO questions (id, session_id, student_id, content, asked_at) VALUES
    ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000002',
     'What is the difference between simple and multiple linear regression?',
     now() - interval '7 days' + interval '10 minutes'),
    ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000004',
     'Can you explain when we should use multiple predictors instead of one?',
     now() - interval '7 days' + interval '12 minutes'),
    ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000006',
     'Is there a limit to how many predictors we can add in multiple regression?',
     now() - interval '7 days' + interval '14 minutes'),

-- TOPIC B: MSE Cost Function
    ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000003',
     'Why do we square the errors in the MSE cost function?',
     now() - interval '7 days' + interval '25 minutes'),
    ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000002',
     'Why not use the absolute value of errors instead of squaring them?',
     now() - interval '7 days' + interval '26 minutes'),
    ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000005',
     'Does MSE treat over-predictions and under-predictions differently?',
     now() - interval '7 days' + interval '28 minutes'),
    ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000007',
     'How does MSE compare to RMSE? When would I use one over the other?',
     now() - interval '7 days' + interval '30 minutes'),
    ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000008',
     'Can MSE ever be negative, or is it always positive?',
     now() - interval '7 days' + interval '32 minutes'),

-- TOPIC C: R-squared and Overfitting
    ('00000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000002',
     'What is R-squared and how do we interpret it?',
     now() - interval '7 days' + interval '45 minutes'),
    ('00000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000003',
     'How do we know if our linear regression model is overfitting?',
     now() - interval '7 days' + interval '48 minutes'),
    ('00000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000004',
     'What is the difference between Ridge and Lasso regularisation?',
     now() - interval '7 days' + interval '52 minutes'),
    ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000009',
     'Can a model have a high R-squared and still be a bad model?',
     now() - interval '7 days' + interval '55 minutes'),
    ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000006',
     'What is the elastic net and how does it combine Ridge and Lasso?',
     now() - interval '7 days' + interval '58 minutes');

-- ── Session 2 questions ─────────────────────────────────────────────────────

-- TOPIC D: Learning Rate
INSERT INTO questions (id, session_id, student_id, content, asked_at) VALUES
    ('00000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000002',
     'What is the learning rate and how do I choose a good value for it?',
     now() - interval '30 minutes'),
    ('00000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000003',
     'What happens if the learning rate is too large or too small?',
     now() - interval '28 minutes'),
    ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000004',
     'Is there a systematic way to find the optimal learning rate?',
     now() - interval '26 minutes'),

-- TOPIC E: Convergence
    ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000002',
     'How do we know when gradient descent has converged?',
     now() - interval '20 minutes'),
    ('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000005',
     'What is the difference between batch gradient descent and stochastic gradient descent?',
     now() - interval '18 minutes'),

-- TOPIC F: Local Minima / Saddle Points
    ('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000003',
     'Can gradient descent get stuck in a local minimum?',
     now() - interval '12 minutes'),
    ('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000021',
     '00000000-0000-0000-0000-000000000004',
     'What is a saddle point and does it cause problems for gradient descent?',
     now() - interval '10 minutes');


-- ── Session 3 questions (Images as Graphs) ──────────────────────────────────

-- TOPIC G: Image-to-Graph Representation
INSERT INTO questions (id, session_id, student_id, content, asked_at) VALUES
    ('00000000-0000-0000-0000-0000000000b0', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000002',
     'How exactly do we convert an image into a graph? What are the nodes and edges?',
     now() - interval '2 days' + interval '5 minutes'),
    ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000005',
     'What does the weight of an edge represent in an image graph?',
     now() - interval '2 days' + interval '7 minutes'),
    ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000006',
     'Why would we represent an image as a graph instead of just using the pixel grid directly?',
     now() - interval '2 days' + interval '9 minutes'),
    ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000009',
     'How do we decide which pixels should be connected as neighbours in the graph?',
     now() - interval '2 days' + interval '11 minutes'),

-- TOPIC H: Graph Cuts and Segmentation
    ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000003',
     'What is a graph cut and how does it help with image segmentation?',
     now() - interval '2 days' + interval '15 minutes'),
    ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000004',
     'Why does minimum cut tend to cut off small isolated groups of pixels?',
     now() - interval '2 days' + interval '17 minutes'),
    ('00000000-0000-0000-0000-0000000000b6', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000007',
     'How is the Normalised Cut different from the regular minimum cut?',
     now() - interval '2 days' + interval '19 minutes'),
    ('00000000-0000-0000-0000-0000000000b7', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000002',
     'Can graph cuts segment an image into more than two regions?',
     now() - interval '2 days' + interval '21 minutes'),
    ('00000000-0000-0000-0000-0000000000b8', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000008',
     'What is the assoc(A,V) term in the Normalised Cut formula?',
     now() - interval '2 days' + interval '23 minutes'),

-- TOPIC I: Affinity Matrix and Gaussian Kernel
    ('00000000-0000-0000-0000-0000000000b9', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000005',
     'What is the affinity matrix and how is it constructed?',
     now() - interval '2 days' + interval '28 minutes'),
    ('00000000-0000-0000-0000-0000000000ba', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000003',
     'How does the sigma parameter in the Gaussian kernel affect segmentation results?',
     now() - interval '2 days' + interval '30 minutes'),
    ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000006',
     'What feature vectors can we use for each pixel besides just intensity?',
     now() - interval '2 days' + interval '32 minutes'),

-- TOPIC J: Spectral Clustering and Laplacian
    ('00000000-0000-0000-0000-0000000000bc', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000004',
     'What is spectral clustering and how does it relate to graph cuts?',
     now() - interval '2 days' + interval '38 minutes'),
    ('00000000-0000-0000-0000-0000000000bd', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000002',
     'What is the graph Laplacian and why is it important?',
     now() - interval '2 days' + interval '40 minutes'),
    ('00000000-0000-0000-0000-0000000000be', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000007',
     'What is the Fiedler vector and how does it give us a segmentation?',
     now() - interval '2 days' + interval '42 minutes'),
    ('00000000-0000-0000-0000-0000000000bf', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000008',
     'How do we choose the number of eigenvectors k for multi-scale segmentation?',
     now() - interval '2 days' + interval '44 minutes'),
    ('00000000-0000-0000-0000-0000000000c0', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000009',
     'I am confused about the difference between the degree matrix and the Laplacian. Can you clarify?',
     now() - interval '2 days' + interval '46 minutes'),

-- TOPIC K: Practical Methods (GrabCut, Superpixels, Efficiency)
    ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000003',
     'What is GrabCut and how does the user interact with it?',
     now() - interval '2 days' + interval '52 minutes'),
    ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000005',
     'What are superpixels and why are they useful for segmentation?',
     now() - interval '2 days' + interval '54 minutes'),
    ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000004',
     'Why is a fully connected graph impractical for large images? What approximations are used?',
     now() - interval '2 days' + interval '56 minutes'),
    ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000009',
     'How does SLIC compute superpixels? Is it related to k-means?',
     now() - interval '2 days' + interval '58 minutes'),
    ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-000000000022',
     '00000000-0000-0000-0000-000000000007',
     'What are the practical advantages of using superpixels before running spectral clustering?',
     now() - interval '2 days' + interval '60 minutes');


-- ── Answers ──────────────────────────────────────────────────────────────────

INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms) VALUES
    -- Session 1 / Topic A: Simple vs Multiple
    ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000050',
     'Simple linear regression models a single predictor variable, while multiple linear regression models two or more predictors. Both fit a linear equation that minimises MSE, but multiple regression captures interactions between features and typically explains more variance.',
     'gpt-4o', 820),
    ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000051',
     'You should use multiple predictors when you believe more than one variable influences the outcome. For instance, predicting house price from both square footage and location is far more accurate than using only one. Adding predictors always lowers training error, but watch out for overfitting and check adjusted R².',
     'gpt-4o', 740),
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1',
     'There is no hard mathematical limit on the number of predictors, but practical constraints apply. You need more observations than predictors (n > p), otherwise the model is under-determined. Having too many predictors relative to observations leads to overfitting. Techniques like Lasso can help by performing automatic feature selection.',
     'gpt-4o', 780),

    -- Session 1 / Topic B: MSE Squaring
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000052',
     'Squaring errors serves two purposes: it makes all residuals positive so positive and negative errors do not cancel, and it penalises large errors more heavily than small ones — a model 10 units off is penalised 100× more than one unit off, encouraging precise predictions.',
     'gpt-4o', 910),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000053',
     'Using absolute values (MAE) is also valid and more robust to outliers. Squared errors are preferred because the function is differentiable everywhere (absolute value is not differentiable at 0), making gradient-based optimisation cleaner. Both are legitimate loss functions with different trade-offs.',
     'gpt-4o', 870),
    ('00000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000054',
     'MSE treats over-predictions and under-predictions symmetrically — (ŷ − y)² is the same regardless of the sign of the error. If you need asymmetric penalties (e.g., under-predicting demand is worse than over-predicting), you would use a custom loss function instead.',
     'gpt-4o', 680),
    ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a2',
     'RMSE is simply the square root of MSE: RMSE = √MSE. The key difference is that RMSE is in the same units as the target variable, making it more interpretable. MSE penalises large errors more because it squares them. Use RMSE when you want an error metric in the original units; use MSE when you need a differentiable loss function for optimisation.',
     'gpt-4o', 750),
    ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000a3',
     'MSE is always non-negative because it is a sum of squared terms: MSE = (1/n)Σ(ŷ_i − y_i)². Since each squared difference is ≥ 0, the mean must also be ≥ 0. MSE equals 0 only when every prediction exactly matches the true value, which almost never happens in practice.',
     'gpt-4o', 620),

    -- Session 1 / Topic C: R-squared / Overfitting
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000055',
     'R-squared measures the proportion of variance in the target variable explained by the model (range 0–1). R² = 1 − (SS_res / SS_tot). A value of 0.85 means the model explains 85% of the variance. However, adding more features always increases R², so use adjusted R² when comparing models with different numbers of predictors.',
     'gpt-4o', 980),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000056',
     'Signs of overfitting: very high training R² but much lower test R², or training error decreasing while validation error increases. Use a hold-out test set or k-fold cross-validation to detect overfitting. Ridge or Lasso regularisation are the standard remedies for linear regression.',
     'gpt-4o', 850),
    ('00000000-0000-0000-0000-000000000077', '00000000-0000-0000-0000-000000000057',
     'Ridge (L2) adds λΣθ² to the cost function, shrinking all coefficients towards zero without eliminating any. Lasso (L1) adds λΣ|θ|, which can shrink coefficients to exactly zero, effectively performing feature selection. Ridge is preferred when most features are relevant; Lasso when you expect many irrelevant features.',
     'gpt-4o', 920),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000a4',
     'Yes! A model can have a high R-squared on the training data but still be a bad model. This happens when the model overfits — it memorises the training data (including noise) but fails to generalise. That is why you should always evaluate on a held-out test set and use adjusted R² when comparing models with different numbers of features.',
     'gpt-4o', 830),
    ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000a5',
     'Elastic net combines Ridge and Lasso penalties: λ₁Σ|θ| + λ₂Σθ². It inherits Lasso''s ability to set coefficients to zero (feature selection) while maintaining Ridge''s stability when features are correlated. The mixing parameter α controls the balance: α=1 is pure Lasso, α=0 is pure Ridge.',
     'gpt-4o', 890),

    -- Session 2 / Topic D: Learning Rate
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000058',
     'The learning rate (α) controls how large each update step is. Typical starting values are 0.01 or 0.001. A common approach is to try a range on a log scale (0.0001, 0.001, 0.01, 0.1) and plot the loss curve — choose the largest value that still converges steadily without oscillation.',
     'gpt-4o', 760),
    ('00000000-0000-0000-0000-000000000079', '00000000-0000-0000-0000-000000000059',
     'Too large: the loss may oscillate or diverge because the algorithm overshoots the minimum on each step. Too small: the algorithm converges but extremely slowly, requiring many more iterations. The ideal rate causes the loss to decrease smoothly each iteration.',
     'gpt-4o', 690),
    ('00000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000060',
     'Learning rate schedules help systematically: start with a larger rate and reduce it over time (step decay, cosine annealing). Adaptive optimisers such as Adam and RMSprop automatically adjust per-parameter learning rates, which largely eliminates manual tuning.',
     'gpt-4o', 810),

    -- Session 2 / Topic E: Convergence
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000061',
     'Gradient descent has converged when the norm of the parameter update ||Δθ|| falls below a small threshold ε (e.g., 1e-6), or when the loss stops decreasing meaningfully. In practice, training is stopped after a fixed number of epochs or via early stopping on a validation set.',
     'gpt-4o', 720),
    ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000062',
     'Batch GD computes the gradient using the entire dataset per step — expensive but stable. SGD uses one random sample per step — fast but noisy. Mini-batch GD (typical default) uses a small batch (32–256 samples) and balances speed and stability, and is what most deep learning frameworks use by default.',
     'gpt-4o', 890),

    -- Session 2 / Topic F: Local Minima
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000063',
     'For convex problems like linear regression with MSE, there is only one global minimum, so gradient descent always finds the optimal solution. For non-convex losses (deep neural networks), local minima exist, but most are near the global minimum in high-dimensional spaces. SGD noise can also help escape poor local minima.',
     'gpt-4o', 830),
    ('00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000064',
     'A saddle point is where the gradient is zero but it is neither a local minimum nor maximum — it curves upward in some directions and downward in others. Saddle points are more common than local minima in high-dimensional spaces. Modern optimisers with momentum (Adam, SGD+momentum) naturally escape saddle points.',
     'gpt-4o', 770),


    -- Session 3 / Topic G: Image-to-Graph Representation
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-0000000000b0',
     'Each pixel in the image becomes a node in the graph. Edges connect neighbouring pixels — typically the 4 or 8 nearest neighbours on the pixel grid. The weight of each edge measures how similar the connected pixels are (e.g., using colour or intensity difference). The resulting graph captures both the spatial structure and visual similarity of the image.',
     'gpt-4o', 850),
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000b1',
     'The edge weight encodes the affinity (similarity) between two pixels. A common formula is W_ij = exp(-||F_i - F_j||²/σ²), where F_i and F_j are feature vectors (like RGB colour). High weight means the pixels are very similar and likely belong to the same object; low weight means they are dissimilar and may be on opposite sides of an edge boundary.',
     'gpt-4o', 780),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000b2',
     'The graph representation lets us use powerful graph algorithms (cuts, spectral methods, random walks) that have no natural equivalent on raw pixel grids. It also makes it easy to incorporate different types of similarity (colour, texture, spatial proximity) through edge weights, and to handle irregular spatial relationships.',
     'gpt-4o', 720),
    ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000b3',
     'The most common approaches are: (1) connect each pixel to its 4 or 8 immediate spatial neighbours (grid connectivity), (2) k-nearest neighbour graph where each pixel connects to its k most similar pixels, and (3) ε-neighbourhood graph where pixels within a certain distance threshold are connected. Spatial locality is almost always used to keep the graph sparse and computationally tractable.',
     'gpt-4o', 810),

    -- Session 3 / Topic H: Graph Cuts and Segmentation
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000b4',
     'A graph cut partitions the nodes (pixels) into two or more groups by removing edges. The "cost" of a cut is the sum of weights of the removed edges. For segmentation, we want cuts that go through low-weight edges (boundaries between dissimilar regions) while keeping high-weight edges (within uniform regions) intact.',
     'gpt-4o', 790),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000b5',
     'Minimum cut has a bias towards cutting off very small groups because isolating a few pixels requires cutting very few edges, giving a low total cut cost. This is undesirable — we usually want balanced segments. The Normalised Cut (NCut) addresses this by dividing the cut cost by the total association of each segment, penalising unbalanced partitions.',
     'gpt-4o', 830),
    ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-0000000000b6',
     'NCut normalises the cut cost by how well-connected each segment is internally: NCut(A,B) = cut(A,B)/assoc(A,V) + cut(A,B)/assoc(B,V). This discourages cutting off small isolated regions. Unlike minimum cut, NCut produces more balanced, perceptually meaningful segments. However, solving NCut exactly is NP-hard — it is approximated via spectral methods.',
     'gpt-4o', 870),
    ('00000000-0000-0000-0000-0000000000e7', '00000000-0000-0000-0000-0000000000b7',
     'Yes! You can recursively apply binary cuts to get more than two segments. Alternatively, use multiple eigenvectors of the graph Laplacian simultaneously and apply k-means clustering in the eigenvector space to directly partition into k segments. This multi-way spectral clustering is the standard approach for producing multiple regions.',
     'gpt-4o', 750),
    ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-0000000000b8',
     'assoc(A,V) is the total association of segment A with all nodes in the graph: assoc(A,V) = Σ_{i∈A, j∈V} W_ij. It measures how well-connected segment A is overall. Dividing the cut cost by assoc(A,V) ensures that a segment that is well-connected internally (high assoc) would need a proportionally large cut to be considered worth splitting.',
     'gpt-4o', 800),

    -- Session 3 / Topic I: Affinity Matrix and Gaussian Kernel
    ('00000000-0000-0000-0000-0000000000e9', '00000000-0000-0000-0000-0000000000b9',
     'The affinity matrix W is an N×N matrix (for N pixels) where entry W_ij represents the similarity between pixels i and j. It is typically constructed using a Gaussian kernel: W_ij = exp(-||F_i - F_j||²/σ²) for pixels that are neighbours, and 0 for non-neighbours. The matrix is symmetric and encodes the full graph structure.',
     'gpt-4o', 760),
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-0000000000ba',
     'σ controls the scale of the similarity measure. Small σ: only very similar pixels get high affinity, leading to many small segments. Large σ: even moderately different pixels are considered similar, leading to fewer, larger segments. Choosing σ is problem-dependent — it is often set to the median of all pairwise distances or tuned by cross-validation.',
     'gpt-4o', 820),
    ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-0000000000bb',
     'Beyond raw intensity, common features include: RGB colour vectors, texture descriptors (e.g., filter bank responses, LBP), gradient magnitude and orientation, and even deep features from a pretrained CNN. Combining multiple features into a single vector (and weighting them appropriately) generally gives better segmentation than intensity alone.',
     'gpt-4o', 790),

    -- Session 3 / Topic J: Spectral Clustering and Laplacian
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-0000000000bc',
     'Spectral clustering relaxes the NP-hard NCut problem into a tractable eigenvalue problem. Instead of finding the optimal discrete partition, it computes the eigenvectors of the normalised graph Laplacian and uses them as continuous coordinates for each pixel. K-means in this eigenvector space then gives the final segmentation. It often produces excellent results in practice.',
     'gpt-4o', 860),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-0000000000bd',
     'The graph Laplacian is L = D − W, where D is the degree matrix (diagonal, D_ii = Σ_j W_ij) and W is the affinity matrix. The Laplacian encodes the graph structure and has key properties: it is positive semi-definite, its smallest eigenvalue is 0 (with eigenvector being all ones), and the number of zero eigenvalues equals the number of connected components.',
     'gpt-4o', 880),
    ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-0000000000be',
     'The Fiedler vector is the eigenvector corresponding to the second-smallest eigenvalue of the Laplacian. It provides a smooth, one-dimensional embedding of the graph. Nodes that should be in the same segment tend to have similar values in the Fiedler vector. Thresholding it at zero (or the median) gives a binary partition — the approximate normalised cut.',
     'gpt-4o', 840),
    ('00000000-0000-0000-0000-0000000000ef', '00000000-0000-0000-0000-0000000000bf',
     'Choosing k is an open problem. Common heuristics include: (1) the eigengap heuristic — look for a large gap between consecutive eigenvalues; k is where the gap is largest, (2) user specification based on the task, (3) hierarchical approaches that try multiple values of k. In practice, the eigengap method works well for images with clear structure.',
     'gpt-4o', 810),
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-0000000000c0',
     'The degree matrix D is a diagonal matrix where D_ii = Σ_j W_ij — it records how well-connected each node is. The Laplacian L = D − W combines the connectivity (D) and similarity (W) information. The Laplacian can also be thought of as a discrete analogue of the continuous Laplace operator, encoding how a function on the graph varies locally.',
     'gpt-4o', 770),

    -- Session 3 / Topic K: Practical Methods (GrabCut, Superpixels, Efficiency)
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1',
     'GrabCut is an interactive segmentation method. The user draws a bounding box around the object of interest. The algorithm fits Gaussian Mixture Models to the foreground and background regions, then iteratively refines the segmentation using graph cuts. The user can optionally provide additional scribbles to correct errors. It works well for extracting objects from complex backgrounds.',
     'gpt-4o', 850),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000c2',
     'Superpixels group pixels into small, roughly uniform regions (typically 100–1000 superpixels for a standard image). They reduce the graph size dramatically — instead of millions of pixel nodes, you have thousands of superpixel nodes. This makes subsequent algorithms like spectral clustering much faster while preserving important boundaries.',
     'gpt-4o', 780),
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000c3',
     'A fully connected graph for an N-pixel image has N(N-1)/2 edges. For a 1-megapixel image, that is about 5×10¹¹ edges — far too many to store or compute over. Practical approximations include k-nearest neighbour graphs, ε-neighbourhood graphs, and limiting connections to a local spatial window (e.g., 5×5 or 10×10 around each pixel).',
     'gpt-4o', 730),
    ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000c4',
     'SLIC initialises cluster centres on a regular grid and then iteratively assigns each pixel to the nearest centre using a distance that combines colour difference and spatial proximity (a modified k-means). The spatial term ensures superpixels are compact. SLIC is fast, simple, and produces regular, boundary-adhering superpixels.',
     'gpt-4o', 800),
    ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000c5',
     'Superpixels as a preprocessing step provide: (1) massive speed-up since the graph shrinks from millions to thousands of nodes, (2) noise reduction since averaging within a superpixel smooths out pixel-level noise, (3) better feature representations since superpixel features aggregate over a local region. The trade-off is a loss of fine-grained detail at superpixel boundaries.',
     'gpt-4o', 820);


-- ── Citations ────────────────────────────────────────────────────────────────

INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order) VALUES
    -- Session 1
    ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000040', 0.93, 1),
    ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000040', 0.89, 1),
    ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000043', 0.76, 2),
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000040', 0.84, 1),
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000044', 0.72, 2),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000041', 0.95, 1),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000041', 0.88, 1),
    ('00000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000041', 0.82, 1),
    ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000041', 0.86, 1),
    ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-000000000041', 0.91, 1),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000043', 0.96, 1),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000040', 0.71, 2),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000044', 0.91, 1),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000043', 0.78, 2),
    ('00000000-0000-0000-0000-000000000077', '00000000-0000-0000-0000-000000000044', 0.94, 1),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000043', 0.88, 1),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000044', 0.82, 2),
    ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-000000000044', 0.92, 1),

    -- Session 2
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000042', 0.92, 1),
    ('00000000-0000-0000-0000-000000000079', '00000000-0000-0000-0000-000000000042', 0.90, 1),
    ('00000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000042', 0.85, 1),
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000045', 0.93, 1),
    ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000045', 0.91, 1),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000046', 0.94, 1),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000042', 0.80, 2),
    ('00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000046', 0.96, 1),

    -- Session 3 / Topic G
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-000000000047', 0.94, 1),
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000050', 0.93, 1),
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000047', 0.81, 2),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000047', 0.87, 1),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000048', 0.78, 2),
    ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-000000000054', 0.92, 1),
    ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-000000000047', 0.76, 2),

    -- Session 3 / Topic H
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000048', 0.95, 1),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000049', 0.93, 1),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000048', 0.82, 2),
    ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-000000000049', 0.96, 1),
    ('00000000-0000-0000-0000-0000000000e7', '00000000-0000-0000-0000-000000000052', 0.88, 1),
    ('00000000-0000-0000-0000-0000000000e7', '00000000-0000-0000-0000-000000000048', 0.75, 2),
    ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-000000000049', 0.91, 1),

    -- Session 3 / Topic I
    ('00000000-0000-0000-0000-0000000000e9', '00000000-0000-0000-0000-000000000050', 0.95, 1),
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000050', 0.92, 1),
    ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-000000000050', 0.84, 1),

    -- Session 3 / Topic J
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000051', 0.94, 1),
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000049', 0.80, 2),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000051', 0.96, 1),
    ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-000000000051', 0.93, 1),
    ('00000000-0000-0000-0000-0000000000ef', '00000000-0000-0000-0000-000000000052', 0.90, 1),
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-000000000051', 0.89, 1),
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-000000000053', 0.74, 2),

    -- Session 3 / Topic K
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000055', 0.95, 1),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000056', 0.94, 1),
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000054', 0.93, 1),
    ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-000000000056', 0.91, 1),
    ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-000000000056', 0.89, 1),
    ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-000000000054', 0.77, 2);


-- ── Pre-seeded feedback (simulates student votes) ─────────────────────────────
-- Thumbs DOWN = AI answer wasn't satisfying → professor should address this

INSERT INTO answer_feedback (answer_id, student_id, feedback) VALUES
    -- ── Session 1 feedback ──────────────────────────────────────────────────

    -- Q: Why do we square errors? — 5 thumbs up (well-answered)
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000007', 'up'),

    -- Q: Absolute value vs squared — 1 up, 3 down → needs professor attention
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000003', 'down'),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000008', 'down'),

    -- Q: R-squared interpretation — 4 thumbs up
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000009', 'up'),

    -- Q: Overfitting detection — 1 up, 2 down → needs attention
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000007', 'down'),

    -- Q: High R² bad model? — 2 up, 3 down → needs attention
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000009', 'down'),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000006', 'down'),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000008', 'down'),

    -- Q: Elastic net — 3 thumbs up
    ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-000000000002', 'up'),

    -- ── Session 2 feedback ──────────────────────────────────────────────────

    -- Q: What is learning rate — 4 thumbs up
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000007', 'up'),

    -- Q: Convergence — 3 down → needs professor attention
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000002', 'down'),
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000004', 'down'),
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000006', 'down'),

    -- Q: Local minima — 1 up, 3 down → needs professor attention
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000003', 'down'),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000008', 'down'),

    -- ── Session 3 feedback (Images as Graphs) ───────────────────────────────

    -- Topic G: Image-to-Graph
    -- Q: How to convert image to graph — 5 thumbs up (great answer)
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-000000000007', 'up'),
    ('00000000-0000-0000-0000-0000000000e0', '00000000-0000-0000-0000-000000000009', 'up'),

    -- Q: Edge weight meaning — 3 up, 1 down
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000008', 'down'),

    -- Q: Why graph representation — 2 up
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000003', 'up'),

    -- Topic H: Graph Cuts
    -- Q: What is graph cut — 4 up
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-000000000009', 'up'),

    -- Q: Min cut bias — 2 up, 3 down → needs professor attention
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000004', 'down'),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000007', 'down'),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000008', 'down'),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000003', 'up'),

    -- Q: NCut vs min cut — 1 up, 2 down → needs attention
    ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-000000000007', 'up'),
    ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-000000000002', 'down'),
    ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-000000000009', 'down'),

    -- Q: assoc(A,V) explained — 0 up, 3 down → needs professor attention
    ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-000000000008', 'down'),
    ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-000000000006', 'down'),

    -- Topic I: Affinity Matrix
    -- Q: How sigma affects segmentation — 1 up, 4 down → needs professor attention
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000003', 'down'),
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000004', 'down'),
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000007', 'down'),
    ('00000000-0000-0000-0000-0000000000ea', '00000000-0000-0000-0000-000000000009', 'down'),

    -- Q: Feature vectors for pixels — 3 up
    ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-0000000000eb', '00000000-0000-0000-0000-000000000008', 'up'),

    -- Topic J: Spectral Clustering
    -- Q: Spectral clustering overview — 4 up
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-0000000000ec', '00000000-0000-0000-0000-000000000009', 'up'),

    -- Q: What is graph Laplacian — 2 up, 4 down → needs professor attention (hard topic!)
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000002', 'down'),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000007', 'down'),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000009', 'up'),
    ('00000000-0000-0000-0000-0000000000ed', '00000000-0000-0000-0000-000000000008', 'down'),

    -- Q: Fiedler vector — 1 up, 3 down → needs attention
    ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-000000000007', 'up'),
    ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-000000000002', 'down'),
    ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-000000000004', 'down'),
    ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-000000000006', 'down'),

    -- Q: Degree vs Laplacian confusion — 0 up, 4 down → professor definitely should cover this
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-000000000009', 'down'),
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-000000000003', 'down'),
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-0000000000f0', '00000000-0000-0000-0000-000000000002', 'down'),

    -- Topic K: Practical Methods
    -- Q: GrabCut — 3 up
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000006', 'up'),

    -- Q: Superpixels — 5 up (students loved this explanation)
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000005', 'up'),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000007', 'up'),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000008', 'up'),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000009', 'up'),

    -- Q: Fully connected graph impractical — 3 up
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000006', 'up'),
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000003', 'up');


-- =============================================================================
-- VERIFY
-- =============================================================================

SELECT 'users'             AS table_name, count(*) FROM users
UNION ALL SELECT 'courses',            count(*) FROM courses
UNION ALL SELECT 'course_enrollments', count(*) FROM course_enrollments
UNION ALL SELECT 'sessions',           count(*) FROM sessions
UNION ALL SELECT 'documents',          count(*) FROM documents
UNION ALL SELECT 'session_documents',  count(*) FROM session_documents
UNION ALL SELECT 'document_chunks',    count(*) FROM document_chunks
UNION ALL SELECT 'questions',          count(*) FROM questions
UNION ALL SELECT 'answers',            count(*) FROM answers
UNION ALL SELECT 'answer_citations',   count(*) FROM answer_citations
UNION ALL SELECT 'answer_feedback',    count(*) FROM answer_feedback
ORDER BY table_name;
