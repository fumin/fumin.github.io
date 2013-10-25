AllJoyn
-------

## The problem, or an example of an application of AllJoyn
Imagine we are at the "F*ck the government" demonstration in August.
At the moment where we light up our phones for a better judicial system for
Taiwan, being so touched and psychologically bonded with each other,
we want to share the photos and moments with people around us instantly to mark the moment.
What technology should we employ to achieve this?

Let's start with the requirements
* Cross platform
* Secure and decentralized, remember we want to f*ck the government.

Next, let's think about the high level implementation design.
First, we need to decide on the underlying communication technology. Options are:
* Relay servers, but we need to deal with the issue of room management, in this case based on proximity.
  As we scale, we'll also need to face the problem of inter-server communication.
  Obviously, servers are not a cost effective solution, an EC2 medium instance costs around $3,000NT a month.
  Last but not least, it's hard to distill trust in our tech savy potential users with a centralized server.
* Hybrid server appraoch, devices handle the discovery themselves,
  and use Interactive Connectivity Establishment (ICE) servers as pipes.
* Bluetooth, designed only for short range, 5~7 size device groups.
* Airdrop, hard to modify for broadcast like needs, does not work for non-Apple devices.
  The same goes for Windows plug and play.
* Wifi, Wifi-direct, 802.11s mesh and friends have great technological prospects.
  802.11s mesh was rectified in 2012, after a remarkably speedy ten years or so of work.

Second, we need to decide on
* The threading model, since the blocking time of network IO cannot be neglected in general,
  and we in effect need all devices to be both a client and a server.
* The marshalling format of our remote procedural calls,
  with an emphasis on ease of implementability on different platforms.
* How we react to dynamic, ad-hoc network changes, and how to ensure security.

