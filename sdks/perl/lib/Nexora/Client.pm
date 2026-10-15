package Nexora::Client;

use strict;
use warnings;
use IO::Socket::INET;
use JSON::PP;

our $VERSION = '0.1.0';

sub new {
    my ($class, %args) = @_;
    my $self = {
        host => $args{host} || '127.0.0.1',
        port => $args{port} || 6380,
        api_key => $args{api_key},
        socket => undef,
    };
    return bless $self, $class;
}

sub connect {
    my ($self) = @_;
    $self->{socket} = IO::Socket::INET->new(
        PeerHost => $self->{host},
        PeerPort => $self->{port},
        Proto    => 'tcp',
    ) or die "Cannot connect to Nexora: $!";
    return $self;
}

sub ping {
    my ($self) = @_;
    return 1;
}

sub close {
    my ($self) = @_;
    $self->{socket}->close if $self->{socket};
}

1;
