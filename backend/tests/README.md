# InvestBuddy Tests

This directory contains tests for the InvestBuddy application.

## Running Tests

To run all tests:

```
cd backend
python -m unittest discover -s tests
```

To run a specific test file:

```
cd backend
python -m unittest tests.test_portfolio_analyzer
```

## Test Files

- `test_portfolio_analyzer.py`: Tests for risk profile assessment and portfolio recommendations 