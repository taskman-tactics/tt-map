# TT Map

Read-only map view of Taskman Tactics, a Risk-inspired OSRS bingo game. Viewers observe Territories, Teams and their standing; capture and play happen outside this app.

## Board

**Territory**:
A closed area of the board that a Team can own. Territories form a partition of the playable board: they share edges with neighbors and their interiors do not overlap. A Territory may be drawn as more than one polygon.
_Avoid_: Country, province, land, tile, border (as a separate entity)

**Region**:
A group of Territories that are geographically close on the board.
_Avoid_: Continent, zone, area

**Defense**:
A Territory's resistance to Attacks, tracked as Base, Current and Max Defense. Current Defense never exceeds Max Defense.
_Avoid_: HP, hitpoints, health

**Holding Team**:
The Team that most recently Captured a Territory and currently holds it.
_Avoid_: Owner, captor, controller, captured by

**Adjacent**:
Two Territories explicitly connected on the board. A Team may only Attack a Territory adjacent to one it holds.
_Avoid_: Neighboring, bordering, connected

## Teams

**Team**:
One of the four competing sides, each representing a God Wars Dungeon general.
_Avoid_: Faction, clan, side, guild

**Player**:
A game participant who belongs to a Team, as either a Contestant or a Tasker.
_Avoid_: Member, user, participant

**Contestant**:
A Player who completes Tasks to Attack Territories.

**Tasker**:
A Player who earns Troops for their Team by completing their own OSRS tasks.

**Captain**:
The Tasker who leads a Team.
_Avoid_: Leader, owner

**Lieutenant**:
The Contestant chosen by a Captain as their Team's second-in-command.
_Avoid_: Lt, co-captain, deputy

**Soldier**:
A Player who is neither the Captain nor the Lieutenant of their Team.
_Avoid_: Member, regular, grunt

**Points**:
A Team's score, earned by capturing and holding Territories.
_Avoid_: Score, VP

## Play

**Event**:
The Taskman Tactics competition as a whole, from its start to its end.
_Avoid_: Game, bingo, season

**Board Event**:
Something that happened during the Event to a Team or Territory, such as an Attack, Capture, Reinforcement or Points award.
_Avoid_: Event (alone), action, move, log entry

**Event Log**:
The chronological list of Board Events for one Team or one Territory.
_Avoid_: History, feed, timeline

**Activity**:
A piece of OSRS content (a boss, raid, minigame, etc.) within a Territory, grouping that Territory's Tasks.
_Avoid_: Content, source, boss (as a general term)

**Task**:
A "Get [drop]" objective under an Activity whose completion triggers an Attack on its Territory.
_Avoid_: Tile, challenge, objective

**Attack Dice Roll**:
The dice notation attached to a Task (e.g. `1d8+1d4`) that is rolled against Current Defense when the Task triggers an Attack.
_Avoid_: Dice Roll, attack roll, roll (alone)

**Machine-Gun Task**:
A Task whose Attack Dice Roll can roll zero, so its failed Attacks only lower Defense on a positive roll.

**Attack**:
An attempt to take a Territory, triggered by completing one of its Tasks.
_Avoid_: Raid, assault

**Capture**:
A successful Attack, which makes the attacking Team the Territory's Holding Team.
_Avoid_: Conquest, takeover

**Reinforcement**:
Spending Troops to raise a Territory's Current Defense.
_Avoid_: Fortify, heal, repair

**Troops**:
The currency Taskers earn for their Team and Captains and Lieutenants spend on Reinforcements.

## People using this app

**Viewer**:
A person using this app to observe the current game state, whether or not they are a Player.
_Avoid_: Spectator, user

**Author**:
A person who draws and maintains Territory geometries for the board (outside the Viewer experience).
_Avoid_: Editor (as a person), cartographer, mapper
