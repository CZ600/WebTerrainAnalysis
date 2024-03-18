import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    """Base config"""           #基类，可以继承衍生出不同的开发环境的配置
    #DEBUG = True
    #DB_SERVER = "localhost"
    #ENV = 'development'

    @property
    def DATABASE_URI(self):
        return 'postgresql://postgres:123456@127.0.0.1/gisc'.format(self.DB_SERVER)
#%sql postgresql://postgres:123456@127.0.0.1/gisc
