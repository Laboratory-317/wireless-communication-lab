# Diagram labels

## wireless
title: Forming a directional beam
subtitle: Coordinated antennas reinforce the signal in a chosen direction
source: Antenna array
target: Directional beam
note: Beam shape and steering are schematic, not a calculated radiation pattern

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
