Install memcached on EC2 with SASL authentication

```
# Install dependencies
yum install cyrus-sasl

# Build memcached and install it in /usr/local/lib/memcached
wget http://memcached.org/latest
tar -zxvf memcached-1.x.x.tar.gz
cd memcached-1.x.x
./configure --prefix=/usr/local/lib/memcached --enable-sasl
make
sudo make install

# Setup credentials
# Assuming our memcached username is 'aaa' and password is 'bbb'
mkdir /usr/local/lib/memcached/sasl
saslpasswd2 -f /usr/local/lib/memcached/sasl/sasldb2 -a memcached -c aaa
echo 'mech_list: plain' >> memcached.conf
echo 'sasldb_path: /usr/local/lib/memcached/sasl/sasldb2' >> memcached.conf

# Create upstart script 
sudo echo 'description "Memcached"
author "fumin <awawfumin@gmail.com>"

start on runlevel [2345]
respawn

script
export SASL_CONF_PATH=/usr/local/lib/memcached/sasl/
# Provision 14.5GB of memory for memcached
/usr/local/lib/memcached/bin/memcached -m 14848 -S -u ec2-user > /var/log/memcached.log 2>&1
end script' > /etc/init/memcached.conf 

# Start memcached
sudo start memcached
```

```
dc = Dalli::Client.new('ec2-0-0-0-0.compute-1.amazonaws.com:11211', username: 'aaa', password: 'bbb', socket_timeout: 5)
dc.stats['ec2-0-0-0-0.compute-1.amazonaws.com:11211']
```
