# Visualization of Fairness Limitations in Automated Decision Systems

Project submission for COS 597Ed
By Irene Fan, Thomas Schaffner, and Gautam Sharma

## Dependencies

Python 3.6.3 or later

Python packages
* Django 2.0 or later
* sklearn 0.19.1 or later
* json 2.0.9 or later
* numpy 1.13.3 or later

## Running locally

Launch the server with

```python3 manage.py runserver```

Then use any browser to navigate to

```localhost:8000```

## Sample Data Files

Two sets of sample files are found in the testfiles directory. Both sets were generated using ``generate_calibrated_data.py``.
```partially_calibrated_*``` files contain one protected field with three values. Scores generated for two of the values are calibrated, while scores for the final (larger) group were generated uniformly at random.

```well_calibrated_*``` files also contain a single protected field with three values, but scores for all values of the protected attribute are calibrated.

