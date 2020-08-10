import { pick } from 'random-js';
import { mt } from './random';

export function choosePrompt() {
  return pick(mt, prompts)
}

export const prompts = [
  "\_\_\_\_\_ gives me nightmares.",
  "\_\_\_\_\_ is better than sex...",
  "\_\_\_\_\_ is NOT allowed in #wittybot.",
  "\_\_\_\_\_ was created especially for television.",
  "A $1000 reward had to be paid to the man who captured the elusive 'hairy beast' which had been reported in many sightings in Texas even though...",
  "A desperate disease requires a dangerous...",
  "A English->German dictionary is most useful when...",
  "Ali Baba said 'Open Sesame' and then...",
  "Although you may not have noticed, in the horror film \"Evil dead III\", I played the part of...",
  "Anybody can win, unless there happens to be...",
  "Arthur knew a weakness of the dragon, it was...",
  "As a token of our appreciation we would like to present you with this...",
  "Beer. \_\_\_\_\_ of champions.",
  "Beggars shouldn't be...",
  "Besides \"Deja Vu all over again,\" another famous Yogi Berra-ism is...",
  "Biology is just so much fun! We found out about \_\_\_\_\_ today.",
  "Buddha is the almighty fat man because...",
  "Burn the witch, the witch is dead. Burn the witch, just bring me back her...",
  "Can you please leave the toilet seat in the \_\_\_\_\_ position?",
  "Canada's major export is...",
  "Cant sleep, clowns will...",
  "Car Dictionary: Dipstick:...",
  "Cheer up, it's not the end of...",
  "Chicken tastes better if you...",
  "Children, your mother and I have decided that...",
  "Chopsticks are very useful, you can use them for...",
  "Could someone get this monkey off my back, he is starting to...",
  "Did you hear that Marilyn Manson is putting out a new cd? Yeah, it's called...",
  "Don't do the crime, if...",
  "Don't ever take \_\_\_\_\_ for granted.",
  "Don't tempt fate, especially when...",
  "Don't you love it when you're starving and you finally...",
  "Don't you love those days when your walking to work and...",
  "Due to overwhelming response...",
  "Dust bunnies only come out...",
  "Ever since I started collecting cans...",
  "Five little ducks went out one day, over the hills and far away. Mother duck said: \"Quack, quack, quack, quack.\" And...",
  "Flavored milk is best used...",
  "Fools rush in where...",
  "For your convenience this airplane is equipped with...",
  "Frankenstein to Al Gore:...",
  "Friends don't let friends...",
  "Fun with acronyms: dodgermas:...",
  "Get a \_\_\_\_\_, everyone's doing it!",
  "Grandpa always has to \_\_\_\_\_ at the family reunions.",
  "Have \_\_\_\_\_, will travel.",
  "Have you \_\_\_\_\_ your dog yet today?",
  "He's got the whole world in his \_\_\_\_\_.",
  "Headlines: Cast of hit TV show found...",
  "Here's a local law I never knew existed:...",
  "How did that happen!?!?! I was 100% sure that...",
  "I also use pancakes for...",
  "I am on a quest to...",
  "I bought a brand new \_\_\_\_\_ today.",
  "I bought a Lamborghini Diablo T 50 for a couple of million dollars but then I accidentally...",
  "I can't wait until the day I can access WittyBot via...",
  "I don't know how to live, but...",
  "I don't want much out of a woman, I only want...",
  "I failed my...",
  "I feel like having a party because tomorrow is...",
  "I have the power to...",
  "I hear \_\_\_\_\_ loves a good game of Witticism...",
  "I just inherited a truckful of dentures. Tomorrow I'll...",
  "I keep a spare \_\_\_\_\_ under the mat just in case of an emergency.",
  "I like to hug...",
  "I looked at the tag on my bed mattress once, it said...",
  "I looked up witticisms in the dictionary and it said...",
  "I love this new satellite phone, I can even call...",
  "I met my new girl friend...",
  "I only bought the new Britney Spears CD because...",
  "I only keep a pair of scissors under my pillow because...",
  "I only let people I know use...",
  "I own \_\_\_\_\_ and I'm proud of it.",
  "I plant carrots, lettuce and \_\_\_\_\_ in my garden...",
  "I put \_\_\_\_\_ on my breakfast cereal to live life dangerously.",
  "I recently read a great review on...",
  "I reckon I'm funnier than Jim Carrey...",
  "I saw \_\_\_\_\_ with a sign saying: Will Work for food.",
  "I think a virtual server is...",
  "I think the coolest power-up in the Super Mario Brothers series was...",
  "I thought I saw Teddybear going into...",
  "I tried sniffing Coke once, but...",
  "I want to go to the moon for...",
  "I was arrested by the fashion police for...",
  "I went on a blind date last night and...",
  "I wish computers could...",
  "I wish we had have \_\_\_\_\_ during the evolution process.",
  "I won't go, I won't sleep, I can't breath, until you're...",
  "I'll be there in two shakes...",
  "I'll only weed your garden if you give me...",
  "I'm a \_\_\_\_\_-doodle dandy.",
  "I'm a raging \_\_\_\_\_-aholic.",
  "I'm gonna get me some Kibbles 'n'...",
  "I'm not a dork, I'm a...",
  "I'm not normally submissive, but...",
  "I'm so addicted to the net...",
  "I'm sorry but you have something that looks like \_\_\_\_\_ stuck in your teeth.",
  "I'm sure my father only drinks to...",
  "I'm too old to \_\_\_\_\_ all night.",
  "I've decided to stop \"fighting the power\" and...",
  "If I had a pickle, a thighmaster, and two penguins, I could...",
  "If I had a set of bagpipes...",
  "If I owned an elephant, I would...",
  "If I was an element on the 'Periodic Table of the Elements', I would be...",
  "If laser guns were more common we could...",
  "If mechanics put go-faster parts on their cars in their spare time, then...",
  "If my house was on fire and I only had time to grab one thing, it would be...",
  "If the plural of goose is geese, then...",
  "If the Spice Girls were still around...",
  "If you are green and have algae on your back, you may be...",
  "If you go behind Mount Rushmoore, you will see...",
  "If you like Pina Coladas.",
  "If you slap me with that trout again I'm going to...",
  "If you're traveling in a car at the speed of light, and you turn on the head lights...",
  "If your mom had another kid with Richard Simmons...",
  "If, instead of sleeping, we had to do something else, I would \_\_\_\_\_ for 8 hours instead...",
  "In order to keep these questions rated G, we...",
  "Instead of sunscreen lotion, I find \_\_\_\_\_ is better.",
  "Instead of taking all my old clothes to charity bins, I...",
  "It ain't rocket science, it's...",
  "It took me a while to finally try one of those...",
  "It was the best of times, it was the worst of times, it was...",
  "It's considered tacky to take a \_\_\_\_\_ to church.",
  "It's so cold today, I can't seem to...",
  "Kelly asked Dan what he felt like for dinner. Dan replied that he had seen a new Chinese restaurant opened down the road, it was called \_\_\_\_\_.",
  "Lay down with dogs you get up with...",
  "Little Red Ridinghood wasn't going to granny's, she was on her way to...",
  "Living on Earth is expensive...",
  "Look ma! No \_\_\_\_\_!",
  "Look, it's \_\_\_\_\_! Shut off the lights and pretend we're not home!",
  "Love conquers...",
  "Lower than...",
  "Martha Stewart needs to...",
  "Mmm Mary, you look absolutely ravishing in that skimpy...",
  "My favorite noise to say when I'm angry is...",
  "My favorite room in the house is...",
  "My favorite tongue twister is...",
  "My favorite trick with the vacuum cleaner is...",
  "My honest opinion about Clinton...",
  "My internet connection stinks because...",
  "My job benefits include...",
  "My neck swells after eating pineapples because...",
  "My socks are so hairy...",
  "My toddler and I were shopping when a heavily tattooed man...",
  "My uncle is a professional cryptologist; he...",
  "Never raise your hands to your kids...",
  "Newest game at the retirement home: Hide and...",
  "News at 10: Blind woman gets new kidney from dad she hasn't seen in years...",
  "Nine out of ten dentist's prefer...",
  "No one is listening until you...",
  "Nothin' on top but a bucket and a mop and...",
  "Oh Canada, our...",
  "Oh No! My \_\_\_\_\_ fell off!",
  "Oh no! My cable guy...",
  "Okay, I'll marry you, but only under one condition...",
  "On rainy days I...",
  "On the days when I'm feeling a little frisky...",
  "On the subway, I...",
  "One important thing you can learn from today's country music is...",
  "Pete and Repeat went out in a boat. Pete jumped off and \_\_\_\_\_ was left.",
  "Pi is equal to...",
  "Pillows should have a warning on them...",
  "Politicians should never be allowed to...",
  "Presidential Candidates no one would vote for:...",
  "Real men drive...",
  "Rejected names for the USA:...",
  "Rejected Witticisms prompts:...",
  "Richard Simmons is shaving \_\_\_\_\_.",
  "Running with \_\_\_\_\_ can put your eye out.",
  "S/he stuck to me like a...",
  "Saddam Hussein's name should be...",
  "Scientists at Harvard predict that by the year 2100...",
  "Scientists have recently found that...",
  "Shut the door! were you born...",
  "Silence is not always golden, sometimes...",
  "SirChris was convicted of underage \_\_\_\_\_.",
  "Something I do in the winter, that I don't do in the summer, is...",
  "Sometimes I wake up grumpy...",
  "Spring has sprung...",
  "Supercalifragilisticexpiali...",
  "Target, It's a sign of the \_\_\_\_\_.",
  "The best things in life...",
  "The boy who cried wolf...",
  "The deed is done, and I'm having fun, I think I'm dumb, I think I'm just...",
  "The first thing God said to me when I arrived in heaven was...",
  "The first time I ran Windows 95...",
  "The generals gathered in their masses. Just like...",
  "The highlight of my career was...",
  "The last time I \_\_\_\_\_ I almost had a heart attack.",
  "The last time I saw the boy who bullied me throughout elementary school, he...",
  "The last time I took Midol...",
  "The last time I tried to shave my cat...",
  "The local grocery store started auditions for the fruit...",
  "The most ugly thing you have ever seen is...",
  "The newest designer drugs...",
  "The one thing on a womans mind when making love is...",
  "The only reason that I stay on IRC and play this game is...",
  "The only thing mockery is good for is...",
  "The problem with America today is that too many people...",
  "The sky is the limit but...",
  "The Sun? Yeah, I've been there. It has...",
  "The survey told me...",
  "The test of talent is how you play the game the first time, not...",
  "The true reason that airlines need flight attendants is...",
  "The truth is out there...",
  "The way to a mans heart is...",
  "The world is a rose: smell it and pass it on to...",
  "The worst thing that can happen to a blood bank is...",
  "The worst thing that can happen to a ghost is...",
  "The worst video game I've ever played was...",
  "The Yugoslavian conflict of 1992 snowballed from...",
  "There I was, a beer in one hand and \_\_\_\_\_ in the other.",
  "There is something missing from this recipe,I think it needs just a little bit of...",
  "They kicked me out of the Art Museum when I...",
  "They SAY orange juice is made from freshly squeezed oranges but I think its made from...",
  "This guy tried to beat on me, but I was saved once again by my...",
  "This time next year I'll be...",
  "To help me remember things, I put my post-it-notes...",
  "To my way of thinking, a luxury toilet would have to be...",
  "Unless otherwise governed by state laws, your service contract will be...",
  "Volvo, They're boxy but...They don't call me \_\_\_\_\_ for nothing.",
  "Wait till they see the \_\_\_\_\_ I left in their birdbath.",
  "Warning! \_\_\_\_\_ may be closer than they actually appear!",
  "Was that your evil twin I saw in the mall or...",
  "Watch out this is hot...",
  "We only come out at night, the days are much too...",
  "We secretly replaced the customers's regular coffee with \_\_\_\_\_. Let's see if he notices.",
  "When babies first enter the world, they must think...",
  "When I don't think about sex I think about...",
  "When I see someone smoking I...",
  "When I was putting on makeup...",
  "When I'm going to the beach I always bring my...",
  "When the gardener comes to mow my lawns, my favorite trick...",
  "When the plumber came, I saw...",
  "When those big trucks go down the highway, I try to...",
  "Whenever I hear sirens I automatically think...",
  "Whenever the \"ERROR 404\" comes up on my computer I...",
  "You can make cheap but effective baby rattles by...",
  "You know you're a pervert when...",
  "You know your refrigerator is too cold when...",
  "You should see Sinead O'Connors new hair cut..."
]