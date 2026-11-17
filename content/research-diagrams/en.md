# Diagram labels

## wireless
title: Directional wireless communication
subtitle: An antenna array directs signals towards users
source: Antenna array
target: User devices
note: Multiple antennas work together

## polar
title: Inside a polar encoder
subtitle: An example encoding transform for four bits
source: Input bits
target: Codeword bits
note: ⊕ — addition modulo 2

## ldpc
title: LDPC: Tanner graph
subtitle: A small example of bit and parity-check connections
source: Codeword bits — variable nodes
target: Check nodes: connected bits sum to 0 modulo 2
note: Circle — bit · square — check · edge — bit participates in a check

## access
title: Multiple access methods
subtitle: Different ways to share radio resources
oma: OMA: TDMA / OFDMA
omanote: Separate time-frequency blocks
noma: PD-NOMA
nomanote: Overlapping signals, different powers
scma: SCMA
scmanote: Sparse codebooks
rsma: RSMA
rsmanote: Common and private streams
note: Conceptual diagrams; not a comparison of method performance

## ris
title: Steering a reflected signal
subtitle: An RIS provides an additional path from transmitter to receiver
source: Transmitter
target: Receiver
surface: RIS panel
wall: Obstacle
note: The direct path is blocked · the signal travels via the RIS
