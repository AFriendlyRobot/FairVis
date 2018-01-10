#!/usr/bin/python3

import argparse
from random import random as r


NUM_BINS = 20
NUM_PER_BIN = 200
NUM_CLASSES = 3
ALL_CAL = True
NUM_EXTRA_FEATURES = 5


class Point:
    def __init__(self, cval, score, outcome, n_extra_feats):
        self.cval = cval
        self.score = score
        self.n_extra_feats = n_extra_feats
        self.outcome = outcome

    def write_point(self, pfile, dfile, sfile):
        # dfile.write(str(self.cval) + ",")
        pfile.write(str(self.cval) + "\n")
        pfile.flush()

        for i in range(self.n_extra_feats):
            dfile.write(str(int(r()*100)))
            dfile.write(",")
        dfile.write(str(self.outcome))
        dfile.write("\n")
        dfile.flush()

        sfile.write(str(self.score) + "\n")
        sfile.flush()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", "--outname", help="Location of output file (no file endings)", required=True)

    options = parser.parse_args()

    run(options.outname)



def run(ofileloc):
    dfile = open(ofileloc + "_data.csv", "w")
    sfile = open(ofileloc + "_scores.txt", "w")
    pfile = open(ofileloc + "_protected.csv", "w")

    pfile.write("PROTECTED\n")

    # dfile.write("PROTECTED,")
    for i in range(NUM_EXTRA_FEATURES-1):
        dfile.write("X"+str(i)+",")
    dfile.write("Y\n")
    dfile.flush()

    sfile.write("USER_SCORE\n")
    sfile.flush()

    var = (1.0 / NUM_BINS) / 2.0
    mids = [((float(i) / NUM_BINS) + var) for i in range(NUM_BINS)]


    points = generate_class(0.5, mids, var, 0, ALL_CAL)
    
    for i in range(NUM_CLASSES - 1):
        por = 0.5 / (NUM_CLASSES - 1)
        points += generate_class(por, mids, var, i+1, True)


    for p in points:
        p.write_point(pfile, dfile, sfile)


    dfile.close()
    sfile.close()






def generate_class(portion, mids, var, cv, is_calibrated):
    n_per_bin = int(NUM_PER_BIN * portion)

    points = []
    for j in range(NUM_BINS):
        for i in range(n_per_bin):
            if is_calibrated:
                nscore = ((r()*var*2)-var)+mids[j]
            else:
                nscore = r()
            noutcome = 1 if (r() < mids[j]) else 0
            npoint = Point(cv, nscore, noutcome, NUM_EXTRA_FEATURES)
            points.append(npoint)

    return points







if __name__ == "__main__":
    main()