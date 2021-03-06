#!/bin/sh
mkdir compiled

python3 render_html.py data templates/index.html > compiled/index.html
cp compiled/index.html .

python3 render_html.py pcpp_data templates/pcpp.html > compiled/pcpp.html

python3 render_tex.py templates/cv.tex > compiled/cv.tex
python3 render_tex.py templates/cv_ac.tex > compiled/cv_ac.tex

cd compiled
pdflatex cv.tex
pdflatex cv_ac.tex
cd ..

pdfjam compiled/cv_ac.pdf postdoc/statement.pdf --outfile postdoc/ta_cv_statement.pdf
#pdfjoin -output postdoc/combined.pdf compiled/cv_ac.pdf postdoc/statement.pdf 
#convert compiled/cv_ac.pdf postdoc/statement.pdf postdoc/combined.pdf
