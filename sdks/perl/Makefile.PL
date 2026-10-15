use 5.030000;
use ExtUtils::MakeMaker;

WriteMakefile(
    NAME              => 'Nexora::Client',
    VERSION_FROM      => 'lib/Nexora/Client.pm',
    PREREQ_PM         => {
        'IO::Socket::INET' => 0,
        'JSON::PP'         => 0,
    },
    ABSTRACT          => 'Official Perl Client for Nexora Infrastructure Engine',
    AUTHOR            => 'Nexora Contributors <engineering@nexora.dev>',
    LICENSE           => 'mit',
);
