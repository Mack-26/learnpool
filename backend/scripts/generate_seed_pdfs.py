"""Generate placeholder PDFs with sample content for seed documents."""
from pathlib import Path

from fpdf import FPDF

UPLOADS = Path(__file__).resolve().parent.parent / "uploads"
DOCS_DIR = UPLOADS / "courses/00000000-0000-0000-0000-000000000010/docs"


def add_page_content(pdf: FPDF, title: str, content: list[str]) -> None:
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, title, ln=True)
    pdf.ln(5)
    pdf.set_font("helvetica", size=11)
    for para in content:
        pdf.multi_cell(0, 6, para)
        pdf.ln(2)


def main() -> None:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    # Lecture 1: Linear Regression (Intro to ML)
    pdf = FPDF()
    add_page_content(
        pdf,
        "Lecture 1 - Linear Regression",
        [
            "Linear regression is a supervised learning algorithm that models the relationship between "
            "a dependent variable and one or more independent variables by fitting a linear equation to observed data.",
            "Simple linear regression uses one predictor: y = mx + b. Multiple linear regression uses "
            "two or more predictors to model complex relationships.",
            "The cost function for linear regression is the Mean Squared Error (MSE): J(theta) = (1/2m) sum(h(x) - y)^2. "
            "Errors are squared to make all errors positive and to penalise large deviations more than small ones.",
            "R-squared (R^2) measures the proportion of variance explained by the model, ranging from 0 to 1. "
            "A value close to 1 indicates a strong fit.",
        ],
    )
    add_page_content(
        pdf,
        "Key Concepts",
        [
            "Gradient descent: An optimization algorithm that iteratively adjusts parameters in the direction "
            "of steepest descent of the loss function.",
            "Learning rate: Controls the step size. Too high causes divergence; too small leads to slow convergence.",
            "Overfitting: When the model fits training data too closely and fails to generalize. "
            "Use regularization (Ridge, Lasso) to prevent this.",
        ],
    )
    pdf.output(DOCS_DIR / "lecture1_linear_regression.pdf")

    # Lecture 2: Gradient Descent (Intro to ML)
    pdf = FPDF()
    add_page_content(
        pdf,
        "Lecture 2 - Gradient Descent",
        [
            "Gradient descent is an optimization algorithm used to minimize the cost function in machine learning. "
            "It iteratively adjusts model parameters in the direction of steepest descent.",
            "The update rule: theta = theta - alpha * gradient(J), where alpha is the learning rate.",
            "Batch gradient descent: Uses the entire dataset for each update. Stable but slow for large datasets.",
            "Stochastic gradient descent (SGD): Uses one sample at a time. Faster but noisier updates.",
            "Mini-batch gradient descent: Uses small batches. Balances speed and stability.",
        ],
    )
    add_page_content(
        pdf,
        "Practical Tips",
        [
            "Learning rate scheduling: Start with a larger rate, then decay. Helps escape local minima early "
            "and converge precisely later.",
            "Momentum: Accelerates in consistent directions, dampens oscillations. "
            "v = beta*v + (1-beta)*gradient(J), theta = theta - alpha*v",
            "Adam optimizer: Combines momentum and RMSprop. Often the default choice for neural networks.",
        ],
    )
    pdf.output(DOCS_DIR / "lecture2_gradient_descent.pdf")

    # Textbook Chapter 3 (SAT Math + ML bridge)
    pdf = FPDF()
    add_page_content(
        pdf,
        "Chapter 3 - Algebra and Functions",
        [
            "SAT Math focuses on algebra, problem-solving, and data analysis. Key skills include "
            "linear equations, systems of equations, and interpreting graphs.",
            "Linear equations: y = mx + b. Slope m = rise/run. Understanding slope is foundational "
            "for both SAT math and machine learning (gradients).",
            "Systems of equations: Solving for multiple unknowns. In ML, we often solve systems "
            "when finding optimal parameters (e.g., normal equation for linear regression).",
            "Exponential growth: y = a * b^x. Appears in SAT word problems and in ML (e.g., learning rate decay).",
        ],
    )
    add_page_content(
        pdf,
        "From SAT to ML",
        [
            "The algebra you learn for SAT - functions, graphs, rates of change - directly applies to "
            "understanding machine learning. A gradient is essentially a slope in higher dimensions.",
            "Practice interpreting graphs: slope, intercepts, and trends. These skills transfer to "
            "understanding loss curves and model performance.",
        ],
    )
    pdf.output(DOCS_DIR / "textbook_chapter3.pdf")

    # 07 Images as Graphs (Intro to ML - graph-based image processing)
    pdf = FPDF()
    add_page_content(
        pdf,
        "07 - Images as Graphs",
        [
            "Images can be represented as graphs, enabling powerful graph algorithms for segmentation "
            "and analysis. Each pixel (or superpixel) becomes a node; edges connect similar neighbors.",
            "Graph cuts: Partition the graph to separate foreground from background. Minimize a cut "
            "that balances edge weights and region consistency.",
            "Spectral clustering: Uses eigenvectors of the graph Laplacian to find natural clusters. "
            "Reveals structure that k-means might miss.",
        ],
    )
    add_page_content(
        pdf,
        "Superpixels and Efficiency",
        [
            "Superpixels group pixels into small, roughly uniform regions (typically 100-1000 per image). "
            "They reduce the graph size dramatically.",
            "Instead of millions of pixel nodes, you have thousands of superpixel nodes. This makes "
            "spectral clustering and other algorithms much faster while preserving important boundaries.",
            "Applications: image segmentation, object detection, and medical imaging.",
        ],
    )
    pdf.output(DOCS_DIR / "07_images_as_graphs.pdf")

    print("Generated 4 PDFs in", DOCS_DIR)


if __name__ == "__main__":
    main()
