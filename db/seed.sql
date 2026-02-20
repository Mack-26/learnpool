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
        'lecture ' || to_char(now() - interval '7 days', 'YYYY-MM-DD'),
        'released',
        now() - interval '7 days',
        now() - interval '7 days' + interval '90 minutes'
    ),
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000010',
        'lecture ' || to_char(now(), 'YYYY-MM-DD'),
        'active',
        now(),
        NULL
    ),
    (
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000010',
        'lecture ' || to_char(now() - interval '2 days', 'YYYY-MM-DD'),
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
-- QUESTIONS + ANSWERS (cleared — no lecture history)
-- =============================================================================
-- Questions, answers, citations, and feedback are not seeded.
-- Chat history starts empty.



-- =============================================================================
-- DOCUMENT CONTENT (for inline preview — avoids blank PDF iframe)
-- =============================================================================

UPDATE documents SET content = E'Lecture 1 — Linear Regression\n\nLinear regression is a supervised learning algorithm that models the relationship between a dependent variable and one or more independent variables by fitting a linear equation to observed data.\n\nSimple linear regression uses one predictor: y = mx + b. Multiple linear regression uses two or more predictors to model complex relationships.\n\nThe cost function for linear regression is the Mean Squared Error (MSE): J(theta) = (1/2m) sum(h(x) - y)^2. Errors are squared to make all errors positive and to penalise large deviations more than small ones.\n\nR-squared (R^2) measures the proportion of variance explained by the model, ranging from 0 to 1. A value close to 1 indicates a strong fit.\n\nKey Concepts\n\nGradient descent: An optimization algorithm that iteratively adjusts parameters in the direction of steepest descent of the loss function.\n\nLearning rate: Controls the step size. Too high causes divergence; too small leads to slow convergence.\n\nOverfitting: When the model fits training data too closely and fails to generalize. Use regularization (Ridge, Lasso) to prevent this.'
WHERE id = '00000000-0000-0000-0000-000000000030';

UPDATE documents SET content = E'Lecture 2 — Gradient Descent\n\nGradient descent is an optimization algorithm used to minimize the cost function in machine learning. It iteratively adjusts model parameters in the direction of steepest descent.\n\nThe update rule: theta = theta - alpha * gradient(J), where alpha is the learning rate.\n\nBatch gradient descent: Uses the entire dataset for each update. Stable but slow for large datasets.\n\nStochastic gradient descent (SGD): Uses one sample at a time. Faster but noisier updates.\n\nMini-batch gradient descent: Uses small batches. Balances speed and stability.\n\nPractical Tips\n\nLearning rate scheduling: Start with a larger rate, then decay. Helps escape local minima early and converge precisely later.\n\nMomentum: Accelerates in consistent directions, dampens oscillations. v = beta*v + (1-beta)*gradient(J), theta = theta - alpha*v\n\nAdam optimizer: Combines momentum and RMSprop. Often the default choice for neural networks.'
WHERE id = '00000000-0000-0000-0000-000000000031';

UPDATE documents SET content = E'Chapter 3 — Algebra and Functions\n\nSAT Math focuses on algebra, problem-solving, and data analysis. Key skills include linear equations, systems of equations, and interpreting graphs.\n\nLinear equations: y = mx + b. Slope m = rise/run. Understanding slope is foundational for both SAT math and machine learning (gradients).\n\nSystems of equations: Solving for multiple unknowns. In ML, we often solve systems when finding optimal parameters (e.g., normal equation for linear regression).\n\nExponential growth: y = a * b^x. Appears in SAT word problems and in ML (e.g., learning rate decay).\n\nFrom SAT to ML\n\nThe algebra you learn for SAT—functions, graphs, rates of change—directly applies to understanding machine learning. A gradient is essentially a slope in higher dimensions.\n\nPractice interpreting graphs: slope, intercepts, and trends. These skills transfer to understanding loss curves and model performance.'
WHERE id = '00000000-0000-0000-0000-000000000032';

UPDATE documents SET content = E'07 — Images as Graphs\n\nImages can be represented as graphs, enabling powerful graph algorithms for segmentation and analysis. Each pixel (or superpixel) becomes a node; edges connect similar neighbors.\n\nGraph cuts: Partition the graph to separate foreground from background. Minimize a cut that balances edge weights and region consistency.\n\nSpectral clustering: Uses eigenvectors of the graph Laplacian to find natural clusters. Reveals structure that k-means might miss.\n\nSuperpixels and Efficiency\n\nSuperpixels group pixels into small, roughly uniform regions (typically 100–1000 per image). They reduce the graph size dramatically.\n\nInstead of millions of pixel nodes, you have thousands of superpixel nodes. This makes spectral clustering and other algorithms much faster while preserving important boundaries.\n\nApplications: image segmentation, object detection, and medical imaging.'
WHERE id = '00000000-0000-0000-0000-000000000033';


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
