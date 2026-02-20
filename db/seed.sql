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
-- USERS  (1 professor + 4 students)
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
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000005');


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
    );


-- =============================================================================
-- SESSION DOCUMENTS
-- =============================================================================

INSERT INTO session_documents (session_id, document_id, is_active) VALUES
    ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000030', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000030', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000031', true),
    ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000032', false);


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
    );


-- =============================================================================
-- QUESTIONS + ANSWERS + CITATIONS
-- Session 1 (Linear Regression — released): 3 topics × ~3 students each
-- Session 2 (Gradient Descent — active):   3 topics × ~2 students each
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
     now() - interval '7 days' + interval '52 minutes');

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


-- ── Answers ──────────────────────────────────────────────────────────────────

INSERT INTO answers (id, question_id, content, model_used, generation_latency_ms) VALUES
    -- Session 1 / Topic A: Simple vs Multiple
    ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000050',
     'Simple linear regression models a single predictor variable, while multiple linear regression models two or more predictors. Both fit a linear equation that minimises MSE, but multiple regression captures interactions between features and typically explains more variance.',
     'gpt-4o', 820),
    ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000051',
     'You should use multiple predictors when you believe more than one variable influences the outcome. For instance, predicting house price from both square footage and location is far more accurate than using only one. Adding predictors always lowers training error, but watch out for overfitting and check adjusted R².',
     'gpt-4o', 740),

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
     'gpt-4o', 770);


-- ── Citations ────────────────────────────────────────────────────────────────

INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order) VALUES
    -- Session 1
    ('00000000-0000-0000-0000-000000000070', '00000000-0000-0000-0000-000000000040', 0.93, 1),
    ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000040', 0.89, 1),
    ('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000043', 0.76, 2),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000041', 0.95, 1),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000041', 0.88, 1),
    ('00000000-0000-0000-0000-000000000074', '00000000-0000-0000-0000-000000000041', 0.82, 1),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000043', 0.96, 1),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000040', 0.71, 2),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000044', 0.91, 1),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000043', 0.78, 2),
    ('00000000-0000-0000-0000-000000000077', '00000000-0000-0000-0000-000000000044', 0.94, 1),
    -- Session 2
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000042', 0.92, 1),
    ('00000000-0000-0000-0000-000000000079', '00000000-0000-0000-0000-000000000042', 0.90, 1),
    ('00000000-0000-0000-0000-000000000080', '00000000-0000-0000-0000-000000000042', 0.85, 1),
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000045', 0.93, 1),
    ('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000045', 0.91, 1),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000046', 0.94, 1),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000042', 0.80, 2),
    ('00000000-0000-0000-0000-000000000084', '00000000-0000-0000-0000-000000000046', 0.96, 1);


-- ── Pre-seeded feedback (simulates student votes) ─────────────────────────────
-- Thumbs DOWN = AI answer wasn't satisfying → professor should address this

INSERT INTO answer_feedback (answer_id, student_id, feedback) VALUES
    -- Q: Why do we square errors? — 3 thumbs up
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000005', 'up'),

    -- Q: Absolute value vs squared — 1 up, 2 down → needs professor attention
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000003', 'down'),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000002', 'up'),

    -- Q: R-squared interpretation — 2 thumbs up
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000075', '00000000-0000-0000-0000-000000000003', 'up'),

    -- Q: Overfitting detection — 1 up, 1 down
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000004', 'up'),
    ('00000000-0000-0000-0000-000000000076', '00000000-0000-0000-0000-000000000005', 'down'),

    -- Q: What is learning rate — 3 thumbs up
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000002', 'up'),
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000003', 'up'),
    ('00000000-0000-0000-0000-000000000078', '00000000-0000-0000-0000-000000000005', 'up'),

    -- Q: Convergence — 2 down → needs professor attention
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000002', 'down'),
    ('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000004', 'down'),

    -- Q: Local minima — 1 up, 2 down → needs professor attention
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000003', 'down'),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000005', 'down'),
    ('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000002', 'up');


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
