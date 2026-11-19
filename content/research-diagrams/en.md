# Diagram labels

## wireless
title: Base station: electronic beam steering
subtitle: The beam alternates between outdoor and indoor users
source: Antenna array
target: Directional beam
note: Main lobe: 4×4 planar array, λ/2 spacing; normalized array factor

## polar
title: Inside a polar encoder
subtitle: An example encoding transform for four bits
source: Input bits
target: Codeword
note: ⊕ — addition modulo 2

## ldpc
title: LDPC: Tanner graph
subtitle: Codeword bits and their connections to parity checks
source: Codeword bits — variable nodes
target: Check nodes: connected bits sum to 0 modulo 2
note: Circle — bit · square — check · edge — bit participates in a check

## ldpc-recovery
title: How LDPC recovers an erased bit
subtitle: The channel loses one bit value, but its position is known
note: ⊕ denotes XOR. One parity check with a single unknown is enough to recover the bit.

## access
title: One network — many devices
subtitle: A base station coordinates data exchange with connected devices
station: Base station
phone: Phone
laptop: Laptop
sensor: Sensor
note: Multiple access coordinates how devices share a radio channel

## ris
title: Steering a reflected signal
subtitle: An RIS provides an additional path from transmitter to receiver
source: Transmitter
target: Receiver
surface: RIS panel
wall: Obstacle
note: The direct path is blocked · the signal travels via the RIS
