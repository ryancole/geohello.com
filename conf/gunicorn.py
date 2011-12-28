bind = 'unix:/tmp/gunicorn-geohello.sock'
proc_name = 'geohello'
workers = 3
worker_class = 'gevent'
daemon = True
debug = True
logfile = '/home/ryan/logs/gunicorn.log'