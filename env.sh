alias r='clear && clear && unset VCAP_APP_HOST && node app.js'
alias rs='clear && clear && export VCAP_APP_HOST="0.0.0.0" && node app.js'
alias debug='export DEBUG="true"'
debug
alias env.sh='vim /home/rafael/env.sh'
alias update='source /home/rafael/env.sh'
ROOT='/home/rafael/work/bionik'
cd $ROOT
alias charts.js='vim routes/chart/charts.js'
alias display.jade='vim views/charts/display.jade'
alias display.js.jade='vim views/charts/display.js.jade'
alias app.js='vim app.js'
alias config.js='vim routes/chart/config.js'
alias methods.js='vim routes/chart/methods.js'
alias ajax.js.jade='vim views/charts/ajax.js.jade'
alias css='view public/stylesheets/screen.css'
alias scss='sasswatchandedit'

clean() {
	rm -Rf $1
	mkdir $1
}

SASS="$ROOT/public/sass/screen.scss"
CSS="$ROOT/public/stylesheets/screen.css"
sasswatchandedit() {
	compass watch public > compass.out &
	vim $SASS ; pkill compass ; cat compass.out
}

