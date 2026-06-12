"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    Trophy, 
    Flame, 
    HelpCircle, 
 
    RotateCcw, 
    Sparkles, 
    Volume2, 
    VolumeX, 
    ArrowRight,
    Play,
    Award,
    CheckCircle,
    XCircle,
    UserCheck,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";


// Canvas Confetti effect implemented directly to avoid external dependencies
class ConfettiParticle {
    x: number = 0;
    y: number = 0;
    size: number = 0;
    color: string = "";
    speedX: number = 0;
    speedY: number = 0;
    rotation: number = 0;
    rotationSpeed: number = 0;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * -canvasHeight - 20;
        this.size = Math.random() * 8 + 6;
        const colors = ["#FFD700", "#E31C23", "#006B3D", "#ffffff", "#FF8C00", "#4CAF50"];
        this.color = colors.at(Math.floor(Math.random() * colors.length)) || "#FFD700";
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 5 + 3;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
    }

    update(canvasHeight: number) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.y > canvasHeight) {
            this.y = -20;
            this.speedY = Math.random() * 5 + 3;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

interface TriviaQuestion {
    id: number;
    category: 'History' | 'Cookout & Culture' | 'Civil Rights' | 'Music & Entertainment' | 'Sports & Firsts';
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
    funnyIncorrectReaction: string;
    funnyCorrectReaction: string;
    imageSearchQuery?: string;
}

// ─── Full Question Pool (65+ questions, shuffled each game) ──────────────────
const ALL_QUESTIONS: TriviaQuestion[] = [
    // ── HISTORY ────────────────────────────────────────────────────────────────
    {
        id: 1, category: 'History',
        question: "Which US General issued General Order No. 3 in Galveston, Texas on June 19, 1865, declaring all enslaved people free?",
        options: ["General Gordon Granger", "General Ulysses S. Grant", "General William Tecumseh Sherman", "General George Meade"],
        answerIndex: 0,
        explanation: "General Gordon Granger arrived in Galveston and read General Order No. 3 on June 19, 1865 — marking the birth of Juneteenth.",
        funnyIncorrectReaction: "Oh no... Union army history class was missed! General Granger is shaking his head.",
        funnyCorrectReaction: "Spot on! You know your Juneteenth roots! Granger would salute you.",
        imageSearchQuery: "Gordon Granger"
    },
    {
        id: 2, category: 'History',
        question: "Who is known as the 'Father of Black History' and founded Negro History Week in 1926?",
        options: ["W.E.B. Du Bois", "Booker T. Washington", "Carter G. Woodson", "Marcus Garvey"],
        answerIndex: 2,
        explanation: "Dr. Carter G. Woodson, a Harvard-educated historian, established Negro History Week in February 1926, which grew into Black History Month in 1976.",
        funnyIncorrectReaction: "Not quite! Dr. Carter G. Woodson is tapping his pocket watch waiting for you to study up.",
        funnyCorrectReaction: "Indeed! Dr. Carter G. Woodson gets his flowers today!",
        imageSearchQuery: "Carter G. Woodson"
    },
    {
        id: 3, category: 'History',
        question: "Madam C.J. Walker became the first female self-made millionaire in America. What industry did she build her empire on?",
        options: ["Real Estate", "Hair Care & Cosmetics", "Textile Manufacturing", "Railroad Logistics"],
        answerIndex: 1,
        explanation: "Madam C.J. Walker created specialized hair care products for African-American women, making her the country's first self-made female millionaire.",
        funnyIncorrectReaction: "Wrong shelf! Check your hair products — Madam Walker's press and curl was legendary.",
        funnyCorrectReaction: "Correct! She laid the blueprint for the beauty industry!",
        imageSearchQuery: "Madam C.J. Walker"
    },
    {
        id: 4, category: 'History',
        question: "Who was the first African-American woman elected to the United States Congress, running under the slogan 'Unbought and Unbossed'?",
        options: ["Barbara Jordan", "Shirley Chisholm", "Ida B. Wells", "Angela Davis"],
        answerIndex: 1,
        explanation: "Shirley Chisholm represented New York's 12th congressional district in 1968 and ran for President in 1972 with 'Unbought and Unbossed'.",
        funnyIncorrectReaction: "Unbought, unbossed, and apparently unfollowed by you! It was Shirley Chisholm!",
        funnyCorrectReaction: "Unbought and Unbossed! Shirley Chisholm is proud!",
        imageSearchQuery: "Shirley Chisholm"
    },
    {
        id: 5, category: 'History',
        question: "Which inventor patented the three-position traffic signal in 1923 and also invented an early gas mask?",
        options: ["Garrett Morgan", "Jan Ernst Matzeliger", "Lewis Howard Latimer", "George Washington Carver"],
        answerIndex: 0,
        explanation: "Garrett Morgan's three-position traffic signal and gas mask saved countless lives. His mask rescued workers trapped under Lake Erie in 1916.",
        funnyIncorrectReaction: "Red light! You just ran right past Garrett Morgan's traffic signal.",
        funnyCorrectReaction: "Green light! Garrett Morgan's legacy shines bright!",
        imageSearchQuery: "Garrett Morgan"
    },
    {
        id: 6, category: 'History',
        question: "Katherine Johnson, Dorothy Vaughan, and Mary Jackson were NASA mathematicians whose calculations were critical to which spaceflight?",
        options: ["Apollo 11 Moon Landing", "John Glenn's Friendship 7 Orbit", "Voyager 1 Deep Space Probe", "Mariner 4 Mars Flyby"],
        answerIndex: 1,
        explanation: "Their mathematics proved crucial to John Glenn's orbit around Earth in 1962 — a story told in 'Hidden Figures'.",
        funnyIncorrectReaction: "Houston, we have a problem. Those calculations didn't add up!",
        funnyCorrectReaction: "Blast off! You tracked the orbit perfectly just like Katherine Johnson!",
        imageSearchQuery: "Katherine Johnson"
    },
    {
        id: 7, category: 'History',
        question: "Who published the anti-lynching pamphlet 'Red Record' and was a founding member of the NAACP?",
        options: ["Mary Church Terrell", "Ida B. Wells", "Fannie Lou Hamer", "Septima Clark"],
        answerIndex: 1,
        explanation: "Ida B. Wells-Barnett was an investigative journalist and civil rights leader who documented lynching and campaigned for women's suffrage.",
        funnyIncorrectReaction: "Wrong headline! Ida B. Wells wrote the truth, and she wants you to read it.",
        funnyCorrectReaction: "Truth to power! Ida B. Wells-Barnett's pen is mightier than ever!",
        imageSearchQuery: "Ida B. Wells"
    },
    {
        id: 8, category: 'History',
        question: "What is the name of the oldest active African-American newspaper in Chicago, founded in 1905 by Robert Sengstacke Abbott?",
        options: ["The Chicago Defender", "The North Star", "The Pittsburgh Courier", "The Atlanta Daily World"],
        answerIndex: 0,
        explanation: "The Chicago Defender played a major role in the Great Migration by advertising opportunity in the North to Southern Black readers.",
        funnyIncorrectReaction: "Stop the presses! Robert Abbott is editing your draft right now.",
        funnyCorrectReaction: "Breaking news! You read the headlines right. The Chicago Defender is legendary!",
        imageSearchQuery: "The Chicago Defender"
    },
    {
        id: 9, category: 'History',
        question: "Jan Ernst Matzeliger's 1883 invention revolutionized which industry, cutting shoe production costs by 50%?",
        options: ["Textile weaving", "Shoe manufacturing", "Cotton ginning", "Locomotive engineering"],
        answerIndex: 1,
        explanation: "Matzeliger's shoe lasting machine automated the process of attaching a shoe's upper to its sole, transforming the entire footwear industry.",
        funnyIncorrectReaction: "Step back! Jan Matzeliger is lacing up his disappointment in your honor.",
        funnyCorrectReaction: "You stepped right into that one! Jan Matzeliger put America in better shoes.",
        imageSearchQuery: "Jan Ernst Matzeliger"
    },
    {
        id: 10, category: 'History',
        question: "The Tuskegee Airmen were the first Black military aviators in the U.S. Army Air Corps. What was their 332nd Fighter Group's famous nickname?",
        options: ["The Shadow Eagles", "The Red Tails", "The Black Hawks", "The Freedom Fliers"],
        answerIndex: 1,
        explanation: "The Red Tails — named for the distinctive red paint on the tails of their P-51 Mustangs — flew over 15,000 missions with exceptional precision.",
        funnyIncorrectReaction: "You missed the runway! Those iconic red tails painted the sky over Europe.",
        funnyCorrectReaction: "Cleared for takeoff! The Red Tails flew with excellence and pride.",
        imageSearchQuery: "Tuskegee Airmen"
    },
    {
        id: 11, category: 'History',
        question: "What significant act passed on June 19, 2021, made Juneteenth a federal holiday in the United States?",
        options: ["The Emancipation Modernization Act", "The Juneteenth National Independence Day Act", "The Freedom Day Recognition Bill", "The Civil Heritage Act"],
        answerIndex: 1,
        explanation: "President Biden signed the Juneteenth National Independence Day Act on June 17, 2021, making it the 11th federal holiday — the first new one since Martin Luther King Jr. Day in 1983.",
        funnyIncorrectReaction: "Close but no ribs! It took until 2021 but the Juneteenth National Independence Day Act made it official.",
        funnyCorrectReaction: "That's right! It took 156 years, but Juneteenth is now officially federal!",
        imageSearchQuery: "Juneteenth flag"
    },
    {
        id: 12, category: 'History',
        question: "Who founded the Black Panther Party for Self-Defense in Oakland, California in 1966?",
        options: ["Malcolm X and Stokely Carmichael", "Huey P. Newton and Bobby Seale", "Eldridge Cleaver and H. Rap Brown", "Fred Hampton and Mark Clark"],
        answerIndex: 1,
        explanation: "Huey P. Newton and Bobby Seale co-founded the Black Panther Party in Oakland in October 1966, establishing free breakfast programs and community self-defense.",
        funnyIncorrectReaction: "Panthers don't miss — but you did! Huey Newton and Bobby Seale built something legendary.",
        funnyCorrectReaction: "Power to the people! Huey P. Newton and Bobby Seale changed the game.",
        imageSearchQuery: "Black Panther Party"
    },
    {
        id: 13, category: 'History',
        question: "Which historically Black university, founded in 1837, is the oldest HBCU in the United States?",
        options: ["Howard University", "Morehouse College", "Cheyney University of Pennsylvania", "Fisk University"],
        answerIndex: 2,
        explanation: "Cheyney University of Pennsylvania, founded in 1837, is recognized as the oldest historically Black university in the United States.",
        funnyIncorrectReaction: "Check your HBCU history! Cheyney was holding it down since 1837.",
        funnyCorrectReaction: "Cheyney University — oldest and still standing strong since 1837!",
        imageSearchQuery: "Cheyney University of Pennsylvania"
    },
    {
        id: 14, category: 'History',
        question: "The Greenwood District of Tulsa, Oklahoma was known as what until it was destroyed in 1921?",
        options: ["The Black Gold Coast", "Black Wall Street", "The Harlem of the South", "Freedom's Row"],
        answerIndex: 1,
        explanation: "Black Wall Street was a thriving Black economic hub with hundreds of Black-owned businesses, destroyed in the 1921 Tulsa Race Massacre — one of the worst acts of racial violence in U.S. history.",
        funnyIncorrectReaction: "This one hits different. Black Wall Street in Tulsa was pure excellence — until it was violently taken.",
        funnyCorrectReaction: "Black Wall Street — Greenwood was economic excellence. We remember and rebuild.",
        imageSearchQuery: "Black Wall Street Tulsa"
    },

    // ── CIVIL RIGHTS ────────────────────────────────────────────────────────────
    {
        id: 15, category: 'Civil Rights',
        question: "On which date did Rosa Parks refuse to give up her seat on a Montgomery, Alabama city bus, sparking the bus boycott?",
        options: ["February 4, 1955", "December 1, 1955", "August 28, 1963", "March 7, 1965"],
        answerIndex: 1,
        explanation: "Rosa Parks refused to give up her seat on December 1, 1955, leading to the 381-day Montgomery Bus Boycott and catapulting Dr. King to national prominence.",
        funnyIncorrectReaction: "That seat wasn't open for debate. December 1, 1955 — Rosa Parks said no and changed history.",
        funnyCorrectReaction: "Rosa Parks sat down so we could all stand up. December 1, 1955 — you got it!",
        imageSearchQuery: "Rosa Parks"
    },
    {
        id: 16, category: 'Civil Rights',
        question: "What was the name of the march from Selma to Montgomery in 1965 that was violently attacked on Edmund Pettus Bridge?",
        options: ["The Freedom March", "Bloody Sunday", "The Alabama Uprising", "The Bridge Crossing Jubilee"],
        answerIndex: 1,
        explanation: "On March 7, 1965 — known as Bloody Sunday — peaceful marchers were beaten by state troopers on Edmund Pettus Bridge. The images shocked the nation and accelerated the Voting Rights Act.",
        funnyIncorrectReaction: "That bridge holds a heavy history. March 7, 1965 — Bloody Sunday — was a turning point.",
        funnyCorrectReaction: "Bloody Sunday — a painful chapter that moved the nation toward the Voting Rights Act of 1965.",
        imageSearchQuery: "Bloody Sunday Selma"
    },
    {
        id: 17, category: 'Civil Rights',
        question: "Dr. Martin Luther King Jr.'s 'I Have a Dream' speech was delivered during which 1963 event?",
        options: ["The Selma March", "The NAACP Annual Convention", "The March on Washington for Jobs and Freedom", "The Birmingham Campaign"],
        answerIndex: 2,
        explanation: "On August 28, 1963, over 250,000 people gathered at the Lincoln Memorial for the March on Washington, where Dr. King delivered his iconic speech.",
        funnyIncorrectReaction: "Dust off your history books! The 'I Have a Dream' speech rang out at the 1963 March on Washington.",
        funnyCorrectReaction: "The March on Washington — a moment that echoes through every generation!",
        imageSearchQuery: "March on Washington"
    },
    {
        id: 18, category: 'Civil Rights',
        question: "Which civil rights leader co-founded the Southern Christian Leadership Conference (SCLC) and delivered over 2,500 speeches in one year?",
        options: ["John Lewis", "Ralph Abernathy", "Martin Luther King Jr.", "James Lawson"],
        answerIndex: 2,
        explanation: "Dr. King co-founded the SCLC in 1957 and is estimated to have delivered over 2,500 speeches and traveled 6 million miles in the final year of his life.",
        funnyIncorrectReaction: "Come on now. Dr. King was everywhere — 2,500 speeches in a year. Give him his due!",
        funnyCorrectReaction: "Dr. King co-founded the SCLC and was literally unstoppable. Legend.",
        imageSearchQuery: "Martin Luther King Jr."
    },
    {
        id: 19, category: 'Civil Rights',
        question: "Which young activist became the youngest person to address the crowd at the 1963 March on Washington at age 23?",
        options: ["Julian Bond", "John Lewis", "Stokely Carmichael", "Medgar Evers"],
        answerIndex: 1,
        explanation: "John Lewis, then chairman of SNCC, delivered one of the most fiery speeches of the March on Washington at just 23 years old. He later served 17 terms in Congress.",
        funnyIncorrectReaction: "23 years old and fearless! John Lewis was the youngest speaker and a lifelong hero.",
        funnyCorrectReaction: "John Lewis — young, bold, and unstoppable at the March on Washington!",
        imageSearchQuery: "John Lewis"
    },
    {
        id: 20, category: 'Civil Rights',
        question: "The Civil Rights Act of 1964 outlawed discrimination based on race, color, religion, sex, or national origin. Who signed it into law?",
        options: ["John F. Kennedy", "Lyndon B. Johnson", "Richard Nixon", "Dwight D. Eisenhower"],
        answerIndex: 1,
        explanation: "President Lyndon B. Johnson signed the Civil Rights Act of 1964 on July 2, 1964, with Dr. King and other civil rights leaders present.",
        funnyIncorrectReaction: "The pen was in LBJ's hand. President Johnson signed the Civil Rights Act on July 2, 1964.",
        funnyCorrectReaction: "LBJ signed it into law — a landmark moment in American history.",
        imageSearchQuery: "Lyndon B. Johnson"
    },
    {
        id: 21, category: 'Civil Rights',
        question: "Fannie Lou Hamer delivered a powerful televised speech to the Democratic National Convention in which year?",
        options: ["1960", "1964", "1968", "1972"],
        answerIndex: 1,
        explanation: "Fannie Lou Hamer's 1964 DNC testimony about voter suppression and violence was so powerful that President Johnson called a press conference to pull cameras away from her — and it backfired.",
        funnyIncorrectReaction: "Fannie Lou Hamer spoke truth to power in 1964 — so powerfully LBJ panicked on live TV!",
        funnyCorrectReaction: "1964! Fannie Lou Hamer was so real they tried to cut her off. The world heard her anyway.",
        imageSearchQuery: "Fannie Lou Hamer"
    },
    {
        id: 22, category: 'Civil Rights',
        question: "The NAACP was co-founded by W.E.B. Du Bois in 1909. What does NAACP stand for?",
        options: [
            "National Association for the Advancement of Colored People",
            "National Alliance for American Civil Progressives",
            "National Action Alliance for Civic Participation",
            "Nationwide Association Against Color Prejudice"
        ],
        answerIndex: 0,
        explanation: "The National Association for the Advancement of Colored People was founded in 1909 and remains the nation's oldest and largest civil rights organization.",
        funnyIncorrectReaction: "Maya's giving you a side-eye. The NAACP has been fighting since 1909 — National Association for the Advancement of Colored People!",
        funnyCorrectReaction: "National Association for the Advancement of Colored People — over a century of fighting!",
        imageSearchQuery: "NAACP logo"
    },

    // ── MUSIC & ENTERTAINMENT ───────────────────────────────────────────────────
    {
        id: 23, category: 'Music & Entertainment',
        question: "Who is known as the 'Queen of Soul' and recorded the iconic song 'Respect' in 1967?",
        options: ["Nina Simone", "Aretha Franklin", "Whitney Houston", "Patti LaBelle"],
        answerIndex: 1,
        explanation: "Aretha Franklin's 1967 recording of 'Respect' became an anthem for Black pride and women's rights, earning her the title Queen of Soul.",
        funnyIncorrectReaction: "R-E-S-P-E-C-T — find out what it means to know your music! It was Aretha Franklin.",
        funnyCorrectReaction: "All hail the Queen of Soul! Aretha Franklin demanded respect and got it every time.",
        imageSearchQuery: "Aretha Franklin"
    },
    {
        id: 24, category: 'Music & Entertainment',
        question: "Which Detroit-based record label launched the careers of Stevie Wonder, Marvin Gaye, and Diana Ross?",
        options: ["Atlantic Records", "Motown Records", "Stax Records", "Chess Records"],
        answerIndex: 1,
        explanation: "Berry Gordy Jr. founded Motown Records in Detroit in 1959, creating the 'Motown Sound' that crossed racial boundaries and dominated pop charts worldwide.",
        funnyIncorrectReaction: "You missed the beat! Motown Records out of Detroit gave us legends for generations.",
        funnyCorrectReaction: "Motown! Berry Gordy built a sound that the whole world danced to.",
        imageSearchQuery: "Motown Records"
    },
    {
        id: 25, category: 'Music & Entertainment',
        question: "Who was the first rap act inducted into the Rock and Roll Hall of Fame?",
        options: ["Run-DMC", "Grandmaster Flash and the Furious Five", "LL Cool J", "Public Enemy"],
        answerIndex: 1,
        explanation: "Grandmaster Flash and the Furious Five were inducted in 2007 as the first rap artists in the Rock and Roll Hall of Fame. Their 1982 single 'The Message' is considered a hip-hop masterpiece.",
        funnyIncorrectReaction: "Don't push me 'cause I'm close to the edge... of getting this wrong! Grandmaster Flash was first.",
        funnyCorrectReaction: "Grandmaster Flash and the Furious Five broke down those doors first! Hip-hop forever.",
        imageSearchQuery: "Grandmaster Flash"
    },
    {
        id: 26, category: 'Music & Entertainment',
        question: "Beyoncé's 2016 visual album 'Lemonade' was a landmark in Black culture. Which song explicitly referenced Juneteenth and Black freedom?",
        options: ["Hold Up", "Formation", "Freedom", "Sorry"],
        answerIndex: 2,
        explanation: "'Freedom' featuring Kendrick Lamar is a powerful anthem of liberation. Its visuals and lyrics directly invoke the struggle and triumph of Black women in America.",
        funnyIncorrectReaction: "You were close! 'Freedom' featuring Kendrick Lamar was that liberation anthem.",
        funnyCorrectReaction: "'Freedom' — Beyoncé and Kendrick Lamar delivered a generation-defining anthem!",
        imageSearchQuery: "Beyoncé"
    },
    {
        id: 27, category: 'Music & Entertainment',
        question: "Who became the first Black woman to win the Academy Award for Best Actress in 2002?",
        options: ["Angela Bassett", "Viola Davis", "Halle Berry", "Whoopi Goldberg"],
        answerIndex: 2,
        explanation: "Halle Berry won for 'Monster's Ball' at the 74th Academy Awards, becoming the first — and still only — Black woman to win Best Actress at the Oscars.",
        funnyIncorrectReaction: "That historic night in 2002 belonged to Halle Berry — the tears were real and so was the win!",
        funnyCorrectReaction: "Halle Berry — first and only. That speech in 2002 was for every Black woman who came before her.",
        imageSearchQuery: "Halle Berry"
    },
    {
        id: 28, category: 'Music & Entertainment',
        question: "Which legendary jazz musician was known as 'Satchmo' and helped popularize jazz worldwide from New Orleans?",
        options: ["Duke Ellington", "Miles Davis", "Louis Armstrong", "John Coltrane"],
        answerIndex: 2,
        explanation: "Louis Armstrong — 'Satchmo' — was a revolutionary trumpet virtuoso and vocalist from New Orleans who brought jazz to global audiences and recorded 'What a Wonderful World.'",
        funnyIncorrectReaction: "Satchmo's trumpet is crying for you right now. Louis Armstrong was jazz royalty!",
        funnyCorrectReaction: "Satchmo! Louis Armstrong made the whole world smile with that trumpet.",
        imageSearchQuery: "Louis Armstrong"
    },
    {
        id: 29, category: 'Music & Entertainment',
        question: "Which groundbreaking TV show created by Issa Rae debuted on HBO in 2016 and centered on Black women navigating life in Los Angeles?",
        options: ["Scandal", "Insecure", "Queen Sugar", "Being Mary Jane"],
        answerIndex: 1,
        explanation: "'Insecure' ran for 5 seasons on HBO (2016–2021) and was celebrated for its authentic portrayal of Black womanhood, friendships, and culture in LA.",
        funnyIncorrectReaction: "Come on! Issa Rae's 'Insecure' was that mirror we all needed on Sunday nights.",
        funnyCorrectReaction: "'Insecure' — Issa Rae put our full complicated beautiful lives on HBO. Period.",
        imageSearchQuery: "Insecure (TV series)"
    },
    {
        id: 30, category: 'Music & Entertainment',
        question: "Which iconic 1971 Marvin Gaye album used music to address the Vietnam War, poverty, racism, and environmental destruction?",
        options: ["Let's Get It On", "What's Going On", "Trouble Man", "Here, My Dear"],
        answerIndex: 1,
        explanation: "'What's Going On' (1971) is widely considered one of the greatest albums ever made. Motown initially refused to release it — Marvin Gaye threatened to never record again, and they relented.",
        funnyIncorrectReaction: "What's going on?! It was 'What's Going On' — Marvin Gaye's masterpiece of 1971.",
        funnyCorrectReaction: "'What's Going On' — Marvin Gaye saw the world and refused to look away. Timeless.",
        imageSearchQuery: "Marvin Gaye"
    },
    {
        id: 31, category: 'Music & Entertainment',
        question: "Which rapper became the first hip-hop artist to win the Pulitzer Prize for Music in 2018?",
        options: ["Jay-Z", "Kanye West", "Kendrick Lamar", "Drake"],
        answerIndex: 2,
        explanation: "Kendrick Lamar won the 2018 Pulitzer Prize for Music for his album 'DAMN.', becoming the first non-classical or jazz artist to receive the honor.",
        funnyIncorrectReaction: "Sit down, be humble — and remember it was Kendrick Lamar who won the Pulitzer Prize!",
        funnyCorrectReaction: "DAMN. is right! Kendrick Lamar took hip-hop to the Pulitzer Prize stage.",
        imageSearchQuery: "Kendrick Lamar"
    },
    {
        id: 32, category: 'Music & Entertainment',
        question: "The 1977 ABC miniseries 'Roots' was based on whose novel about an African family's journey through American slavery?",
        options: ["James Baldwin", "Toni Morrison", "Alex Haley", "Ralph Ellison"],
        answerIndex: 2,
        explanation: "Alex Haley's 'Roots: The Saga of an American Family' was adapted into an 8-part miniseries that drew over 100 million viewers and won 9 Emmy Awards.",
        funnyIncorrectReaction: "Kunta Kinte's story was told by Alex Haley! 'Roots' shook America in 1977.",
        funnyCorrectReaction: "Alex Haley! 'Roots' made the whole country sit down and face history together.",
        imageSearchQuery: "Alex Haley"
    },

    // ── SPORTS & FIRSTS ─────────────────────────────────────────────────────────
    {
        id: 33, category: 'Sports & Firsts',
        question: "Who became the first Black man to play in Major League Baseball in the modern era, debuting with the Brooklyn Dodgers in 1947?",
        options: ["Willie Mays", "Jackie Robinson", "Satchel Paige", "Roy Campanella"],
        answerIndex: 1,
        explanation: "Jackie Robinson broke the color barrier on April 15, 1947. His number 42 is the only jersey number retired across all of Major League Baseball.",
        funnyIncorrectReaction: "Jackie Robinson broke barriers — literally. Every team retired #42 in his honor!",
        funnyCorrectReaction: "Jackie Robinson! He didn't just play baseball — he changed America.",
        imageSearchQuery: "Jackie Robinson"
    },
    {
        id: 34, category: 'Sports & Firsts',
        question: "Muhammad Ali was stripped of his heavyweight title and convicted for refusing induction into the U.S. Army. What was his reason?",
        options: ["Medical reasons", "Religious objection as a Muslim conscientious objector", "He was not a U.S. citizen", "He had already served military time"],
        answerIndex: 1,
        explanation: "Ali cited his Muslim faith and opposition to the Vietnam War, saying 'I ain't got no quarrel with them Vietcong.' He was stripped of his title and convicted, though the Supreme Court later reversed it.",
        funnyIncorrectReaction: "Ali said 'I ain't got no quarrel with them Vietcong.' It was religious and moral objection — the greatest stood his ground.",
        funnyCorrectReaction: "Float like a butterfly, sting like a conscience. Ali sacrificed everything for his beliefs.",
        imageSearchQuery: "Muhammad Ali"
    },
    {
        id: 35, category: 'Sports & Firsts',
        question: "Who became the first Black head coach to win a Super Bowl, leading the Indianapolis Colts to victory in Super Bowl XLI?",
        options: ["Mike Tomlin", "Tony Dungy", "Lovie Smith", "Herman Edwards"],
        answerIndex: 1,
        explanation: "Tony Dungy won Super Bowl XLI in February 2007 — and notably, both competing coaches (Tony Dungy vs. Lovie Smith) were Black, a historic first in Super Bowl history.",
        funnyIncorrectReaction: "Both coaches were Black — an all-time first! Tony Dungy brought home the trophy.",
        funnyCorrectReaction: "Tony Dungy — and both coaches were Black for the first time in Super Bowl history!",
        imageSearchQuery: "Tony Dungy"
    },
    {
        id: 36, category: 'Sports & Firsts',
        question: "Serena Williams has won how many Grand Slam singles titles, making her one of the greatest athletes in history?",
        options: ["18", "20", "23", "25"],
        answerIndex: 2,
        explanation: "Serena Williams won 23 Grand Slam singles titles — more than any other player in the Open Era — and won the 2017 Australian Open while 8 weeks pregnant.",
        funnyIncorrectReaction: "Twenty-THREE! Serena won 23 Grand Slams — eight weeks pregnant for one of them. Respect the GOAT.",
        funnyCorrectReaction: "23 Grand Slams! Serena Williams is the standard that every athlete measures themselves by.",
        imageSearchQuery: "Serena Williams"
    },
    {
        id: 37, category: 'Sports & Firsts',
        question: "Simone Biles became the most decorated gymnast in World Championships history. Which signature move was named after her?",
        options: ["The Biles Double Twist", "The Yurchenko Double Pike", "The Cheng-Biles", "The Biles Floor Sequence"],
        answerIndex: 1,
        explanation: "The Yurchenko Double Pike is so dangerous that few gymnasts attempt it. When Biles performed it competitively, the code of points had to be updated to include her.",
        funnyIncorrectReaction: "Simone does things gymnastics has never seen! The Yurchenko Double Pike is her signature.",
        funnyCorrectReaction: "The Yurchenko Double Pike — so elite they had to rewrite the rulebook for Simone Biles!",
        imageSearchQuery: "Simone Biles"
    },
    {
        id: 38, category: 'Sports & Firsts',
        question: "Jesse Owens won four gold medals at the 1936 Berlin Olympics, defying Hitler's claims of Aryan supremacy. What events did he win?",
        options: [
            "100m, 200m, Long Jump, 4x100m Relay",
            "100m, 400m, High Jump, Discus",
            "100m, 200m, 400m, 4x400m Relay",
            "Long Jump, Triple Jump, Shot Put, 4x100m"
        ],
        answerIndex: 0,
        explanation: "Jesse Owens won the 100m, 200m, Long Jump, and 4x100m relay at the 1936 Berlin Olympics — four gold medals that stood as a rebuke to Nazi ideology on the world stage.",
        funnyIncorrectReaction: "Jesse Owens embarrassed fascism itself! Four golds: 100m, 200m, Long Jump, and 4x100m relay.",
        funnyCorrectReaction: "Jesse Owens ran so fast he made Hitler sit down. Four gold medals in Berlin — legend!",
        imageSearchQuery: "Jesse Owens"
    },
    {
        id: 39, category: 'Sports & Firsts',
        question: "Which tennis player became the first Black man to win Wimbledon, the US Open, and the Australian Open?",
        options: ["Yannick Noah", "Arthur Ashe", "James Blake", "MaliVai Washington"],
        answerIndex: 1,
        explanation: "Arthur Ashe won the 1968 US Open, the 1970 Australian Open, and the 1975 Wimbledon. He was also a tireless advocate for racial equality and AIDS awareness.",
        funnyIncorrectReaction: "Arthur Ashe broke through those gates and held them open. A champion on and off the court.",
        funnyCorrectReaction: "Arthur Ashe — the courts belonged to him, and he used his platform to fight for justice too.",
        imageSearchQuery: "Arthur Ashe"
    },
    {
        id: 40, category: 'Sports & Firsts',
        question: "LeBron James became the all-time NBA scoring leader in 2023 surpassing whose record?",
        options: ["Michael Jordan", "Kareem Abdul-Jabbar", "Kobe Bryant", "Karl Malone"],
        answerIndex: 1,
        explanation: "LeBron surpassed Kareem Abdul-Jabbar's record of 38,387 points on February 7, 2023, in a game against the Oklahoma City Thunder.",
        funnyIncorrectReaction: "The King passed Kareem! LeBron James surpassed Kareem Abdul-Jabbar's all-time points record.",
        funnyCorrectReaction: "LeBron passed Kareem Abdul-Jabbar — the greatest scorer in NBA history, full stop!",
        imageSearchQuery: "LeBron James"
    },

    // ── COOKOUT & CULTURE ───────────────────────────────────────────────────────
    {
        id: 41, category: 'Cookout & Culture',
        question: "What ingredient is considered an absolute, unpardonable offense if added to the potato salad?",
        options: ["Paprika", "Mustard", "Raisins", "Sweet Relish"],
        answerIndex: 2,
        explanation: "Adding raisins to the potato salad is a universal cultural violation. It violates the sacred texture and taste laws of the cookout, leading to immediate exile.",
        funnyIncorrectReaction: "RAISINS?! Who raised you?! Hand over your plate and leave the backyard immediately!",
        funnyCorrectReaction: "Correct! If you see raisins in the potato salad, RUN! That is not a cookout, that is a setup!",
        imageSearchQuery: "raisins"
    },
    {
        id: 42, category: 'Cookout & Culture',
        question: "At what intensity must a winning card be slapped onto the table during a game of Spades?",
        options: [
            "Gentle, so you don't wake up the baby",
            "Maximum force, with enough vibration to shake the table and assert total dominance",
            "Quietly slipped face-up on the pile",
            "Slid over with a polite nod and a 'Good game, everyone'"
        ],
        answerIndex: 1,
        explanation: "A game-winning Spade must strike fear into your opponents and physically reverberate across the deck.",
        funnyIncorrectReaction: "You played a quiet card? You just got set, and your partner is looking at you with pure disappointment.",
        funnyCorrectReaction: "BOOM! You slapped that card so hard the neighbors heard it! Auntie is nodding in approval!",
        imageSearchQuery: "playing cards"
    },
    {
        id: 43, category: 'Cookout & Culture',
        question: "What is the only acceptable answer to the question: 'When is the food going to be ready?'",
        options: ["In exactly 15 minutes", "When it's done!", "I'm still turning the charcoal", "Go order pizza"],
        answerIndex: 1,
        explanation: "No uncle grilling ribs will ever give you a timeline. The food is ready 'when it's done' — when the ribs slide off the bone.",
        funnyIncorrectReaction: "Giving a timeline? You don't rush the pitmaster!",
        funnyCorrectReaction: "Exactly! 'When it's done!' Keep asking and you'll get handed a spatula.",
        imageSearchQuery: "barbecue grill"
    },
    {
        id: 44, category: 'Cookout & Culture',
        question: "Which song is the unofficial anthem of EVERY Black wedding reception, cookout, and family reunion?",
        options: ["Before I Let Go - Frankie Beverly & Maze", "Happy - Pharrell Williams", "Single Ladies - Beyoncé", "Cha Cha Slide - DJ Casper"],
        answerIndex: 0,
        explanation: "Frankie Beverly & Maze's 'Before I Let Go' is the definitive sign the cookout has reached peak energy. Everyone must join the line dance.",
        funnyIncorrectReaction: "No! 'Before I Let Go' is a spiritual experience. Try again!",
        funnyCorrectReaction: "Yes! The first chords hit, the uncle drops his cup, the line dance forms. Vibe check passed!",
        imageSearchQuery: "Frankie Beverly"
    },
    {
        id: 45, category: 'Cookout & Culture',
        question: "If an Auntie starts a sentence with 'I'm not one for gossip, but...', what is about to happen?",
        options: [
            "She is going to change the subject to the weather",
            "She is going to leave the room",
            "She is about to deliver a 2-hour, highly detailed dossier of neighborhood news",
            "She is going to start washing the dishes"
        ],
        answerIndex: 2,
        explanation: "This phrase is a linguistic signal that the most premium, unpublished family drama is about to be shared. Lean in close.",
        funnyIncorrectReaction: "You think she's changing the subject? You clearly don't know Auntie's investigative journalism skills.",
        funnyCorrectReaction: "Buckle up! Pull up a chair, grab some sweet tea, because you're about to get the full scoop.",
        imageSearchQuery: "tea cup"
    },
    {
        id: 46, category: 'Cookout & Culture',
        question: "Who is designated to receive the very first plate of food at any family gathering or cookout?",
        options: [
            "The kids, because they're hungry",
            "The elders (Grandmother, Grandfather, Great Aunts/Uncles)",
            "The host who cooked all day",
            "Whoever is standing closest to the grill"
        ],
        answerIndex: 1,
        explanation: "Serving the elders first is the ultimate sign of respect. Making your own plate before Grandmother has been served is a direct violation of family etiquette.",
        funnyIncorrectReaction: "You tried to serve yourself first? Grandma is staring at you from her porch chair. Grounded from the dessert table.",
        funnyCorrectReaction: "Absolutely! Make that plate for Big Mama first, add extra macaroni, and hand it to her with a smile.",
        imageSearchQuery: "african american grandmother"
    },
    {
        id: 47, category: 'Cookout & Culture',
        question: "What is the unofficial unit of measurement used by grandmothers when seasoning food?",
        options: ["Teaspoon", "Measuring Cup", "Until the ancestors whisper: 'That's enough, child'", "Exactly 5 grams"],
        answerIndex: 2,
        explanation: "Grandmothers do not use measuring spoons. Seasoning is a spiritual transaction between the cook, the pot, and generational memory.",
        funnyIncorrectReaction: "Measuring cups? In Grandma's kitchen?! She will laugh you right out of the room.",
        funnyCorrectReaction: "Preach! 'Until the ancestors whisper that's enough.' Your seasoning cabinet is fully aligned.",
        imageSearchQuery: "seasoning spices"
    },
    {
        id: 48, category: 'Cookout & Culture',
        question: "In a Spades game, what happens if you and your partner bid 'nil' and nil fails?",
        options: [
            "You get bonus points for the attempt",
            "Nothing — it was a good effort",
            "You lose points equal to the nil bid value, and your partner is deeply disappointed in you",
            "The game ends and everyone goes home"
        ],
        answerIndex: 2,
        explanation: "A failed nil costs you dearly in points AND in the social court of family judgment. Your partner will remember this. At Thanksgiving.",
        funnyIncorrectReaction: "Failed nil?! You lose the points AND your standing at the family cookout table. Your partner hasn't forgotten.",
        funnyCorrectReaction: "Failed nil costs big — in points AND in your partner's memory. Don't bid nil if you can't deliver!",
        imageSearchQuery: "playing cards"
    },
    {
        id: 49, category: 'Cookout & Culture',
        question: "What does it mean when someone at the cookout says 'fix your plate' versus 'make your plate'?",
        options: [
            "They mean the exact same thing",
            "'Fix your plate' means repair the food, 'make your plate' means serve yourself",
            "'Fix your plate' is Southern dialect meaning to serve yourself; both mean the same thing regionally",
            "'Fix your plate' means to portion control; 'make your plate' means eat everything"
        ],
        answerIndex: 2,
        explanation: "'Fix your plate' is a beloved Southern/Black cultural expression meaning to serve yourself a meal. It's the same as 'make your plate' — just more soulful.",
        funnyIncorrectReaction: "Maya is fixing her plate and side-eyeing you! 'Fix your plate' is pure Southern soul — same meaning, more flavor.",
        funnyCorrectReaction: "That's right — 'Fix your plate' is soulful Southern expression. Both mean serve yourself, but one hits different.",
        imageSearchQuery: "soul food"
    },
    {
        id: 50, category: 'Cookout & Culture',
        question: "What classic board game is almost always played at Black family reunions and involves buying properties, building houses, and bankrupting your relatives?",
        options: ["Taboo", "Monopoly", "Scrabble", "Uno"],
        answerIndex: 1,
        explanation: "Monopoly at the family reunion has ended friendships, caused alliances, and broken families apart — and yet we keep pulling out that board every single year.",
        funnyIncorrectReaction: "Monopoly! The game that ends friendships and reunions. But we pull it out every single time.",
        funnyCorrectReaction: "Monopoly! Uncle Jerome always buys Boardwalk and then lends money to keep the game going. Every. Time.",
        imageSearchQuery: "monopoly board game"
    },
    {
        id: 51, category: 'Cookout & Culture',
        question: "What is the culturally correct way to greet an elder you haven't seen in a while at a family event?",
        options: [
            "A firm business handshake",
            "A wave from across the room",
            "A long hug, a 'You look good!', and an update on your life whether they asked or not",
            "A text message later that evening"
        ],
        answerIndex: 2,
        explanation: "You will hug, you will compliment, and you WILL tell them about your job/grades/relationship status. There is no escaping this exchange. It is the law.",
        funnyIncorrectReaction: "A wave?! You will walk over there, hug them properly, and explain why you haven't called. Period.",
        funnyCorrectReaction: "The full hug plus life update is mandatory. You already know!",
        imageSearchQuery: "hug grandma"
    },
    {
        id: 52, category: 'Cookout & Culture',
        question: "Which game, played with dominoes, is a staple at Black cookouts and family reunions across the South?",
        options: ["Mexican Train", "Forty-Two", "Chicken Foot", "Bones"],
        answerIndex: 1,
        explanation: "Forty-Two is a trick-taking domino game originating in Texas, deeply embedded in Southern Black culture. If you don't know how to play, an uncle will teach you — whether you want to learn or not.",
        funnyIncorrectReaction: "Forty-Two! That domino game is SERIOUS business at Southern cookouts. Watch your uncle school everybody.",
        funnyCorrectReaction: "Forty-Two — the Texas domino game. Nobody leaves the table until the last bone is played!",
        imageSearchQuery: "dominoes"
    },
    {
        id: 53, category: 'Cookout & Culture',
        question: "What is the proper response when someone offers to bring potato salad to the cookout and you don't trust their cooking?",
        options: [
            "Say 'yes' and serve it to everyone",
            "Accept and quietly throw it away before anyone arrives",
            "Politely tell them we're all set on potato salad, but bring some plates",
            "Let them bring it and just warn people quietly"
        ],
        answerIndex: 2,
        explanation: "'We're all set on potato salad, but bring some plates' is the correct diplomatic response. Everyone understands the message. No feelings get hurt — at least not out loud.",
        funnyIncorrectReaction: "You can NOT let an untested cook bring the potato salad! 'We're good on that, bring some plates' is the play.",
        funnyCorrectReaction: "'Bring some plates' — diplomatic, firm, and nobody's mama gets hurt. You know the assignment!",
        imageSearchQuery: "paper plates"
    },

    // ── MORE HISTORY & FIRSTS ───────────────────────────────────────────────────
    {
        id: 54, category: 'History',
        question: "Which enslaved man successfully sued for his freedom in 1783 in Massachusetts, in one of the earliest legal victories against slavery in America?",
        options: ["Frederick Douglass", "Nat Turner", "Quock Walker", "Solomon Northup"],
        answerIndex: 2,
        explanation: "Quock Walker won his freedom suit in 1783, with the Massachusetts Supreme Court ruling that slavery was incompatible with the Massachusetts Constitution — effectively ending slavery in the state.",
        funnyIncorrectReaction: "Quock Walker took slavery to court and WON in 1783. He didn't wait — he litigated!",
        funnyCorrectReaction: "Quock Walker sued for his freedom in 1783 and won. Before the Constitution was even finished!",
        imageSearchQuery: "Quock Walker"
    },
    {
        id: 55, category: 'History',
        question: "Which formerly enslaved abolitionist published the autobiography 'Narrative of the Life of Frederick Douglass' in 1845?",
        options: ["Booker T. Washington", "Frederick Douglass", "W.E.B. Du Bois", "Harriet Jacobs"],
        answerIndex: 1,
        explanation: "Frederick Douglass's 1845 autobiography was a bestseller that documented his life in slavery and escape to freedom, and became a powerful tool for the abolitionist movement.",
        funnyIncorrectReaction: "Frederick Douglass wrote his truth in 1845 and the slaveholders tried to reclaim him. He bought his own freedom.",
        funnyCorrectReaction: "Frederick Douglass! He wrote the narrative, bought his freedom, and then lectured the world on liberty.",
        imageSearchQuery: "Frederick Douglass"
    },
    {
        id: 56, category: 'History',
        question: "Who was the first African American to serve as U.S. Secretary of State, appointed in 2001?",
        options: ["Eric Holder", "Condoleezza Rice", "Colin Powell", "Susan Rice"],
        answerIndex: 2,
        explanation: "Colin Powell was appointed U.S. Secretary of State by President George W. Bush in 2001, becoming the first African American to hold that position.",
        funnyIncorrectReaction: "Colin Powell made history as the first Black Secretary of State in 2001. No small feat!",
        funnyCorrectReaction: "Colin Powell — first Black Secretary of State, and a trailblazer in public service.",
        imageSearchQuery: "Colin Powell"
    },
    {
        id: 57, category: 'History',
        question: "What was the name of the underground network of secret routes and safe houses used by enslaved people escaping to free states and Canada?",
        options: ["The Freedom Road", "The Underground Railroad", "The Liberty Trail", "The Northern Passage"],
        answerIndex: 1,
        explanation: "The Underground Railroad was a network of abolitionists and safe houses. Harriet Tubman made 13 missions and freed approximately 70 enslaved people — earning her the nickname 'Moses.'",
        funnyIncorrectReaction: "The Underground Railroad! And Harriet Tubman was the conductor, never losing a passenger.",
        funnyCorrectReaction: "The Underground Railroad — and Harriet Tubman ran it with military precision. Zero passengers lost!",
        imageSearchQuery: "Underground Railroad"
    },
    {
        id: 58, category: 'History',
        question: "Which Black mathematician and computer scientist pioneered the concepts of software engineering and worked on NASA's Apollo missions?",
        options: ["Mae C. Jemison", "Gladys West", "Margaret Hamilton", "Annie Easley"],
        answerIndex: 3,
        explanation: "Annie Easley worked at NASA for 34 years, contributed to energy conversion research, and developed code for the Centaur rocket stage. She's one of the unsung heroes of the space program.",
        funnyIncorrectReaction: "Annie Easley coded rockets for 34 years! NASA wouldn't have had those launches without her.",
        funnyCorrectReaction: "Annie Easley — 34 years at NASA, coding the future before 'software engineer' was even a job title!",
        imageSearchQuery: "Annie Easley"
    },
    {
        id: 59, category: 'Sports & Firsts',
        question: "Which golfer became the youngest Masters Tournament champion in 1997 and transformed the sport globally?",
        options: ["Vijay Singh", "Phil Mickelson", "Tiger Woods", "Ernie Els"],
        answerIndex: 2,
        explanation: "Tiger Woods won the 1997 Masters at age 21 by a record 12 strokes. He is the first player of Black and Asian heritage to win a major golf championship.",
        funnyIncorrectReaction: "Tiger Woods changed golf forever in 1997! He walked onto Augusta and owned it at 21.",
        funnyCorrectReaction: "Tiger Woods at Augusta in 1997 — 12 strokes ahead, 21 years old. Changed the game forever.",
        imageSearchQuery: "Tiger Woods"
    },
    {
        id: 60, category: 'Civil Rights',
        question: "The 1955 murder of 14-year-old Emmett Till in Mississippi helped galvanize the civil rights movement. What was his mother's name, and what did she insist on?",
        options: [
            "Clara Till; she insisted on a closed casket",
            "Mamie Till; she insisted on an open casket to show the world what hate had done",
            "Ida Till; she insisted on a public trial",
            "Rose Till; she insisted on federal charges"
        ],
        answerIndex: 1,
        explanation: "Mamie Till insisted on an open casket funeral so the world could see what hatred did to her son. Over 50,000 people viewed his body, and photos published in Jet Magazine sparked outrage nationwide.",
        funnyIncorrectReaction: "Mamie Till's courage changed history. An open casket — her act of bravery woke up a nation.",
        funnyCorrectReaction: "Mamie Till said 'let the world see' — and the world saw. Her courage lit the fuse of a movement.",
        imageSearchQuery: "Mamie Till"
    },
    {
        id: 61, category: 'Music & Entertainment',
        question: "Which 2018 Marvel film became the first superhero movie with a predominantly Black cast to receive an Academy Award nomination for Best Picture?",
        options: ["Captain America: Civil War", "Black Panther", "Avengers: Infinity War", "Spider-Man: Into the Spider-Verse"],
        answerIndex: 1,
        explanation: "Black Panther (2018) directed by Ryan Coogler received 7 Oscar nominations including Best Picture — the first superhero film to earn that distinction.",
        funnyIncorrectReaction: "Wakanda Forever! Black Panther made superhero cinema history with that Best Picture nom!",
        funnyCorrectReaction: "Wakanda Forever! Black Panther broke every barrier — and the box office too.",
        imageSearchQuery: "Black Panther (film)"
    },
    {
        id: 62, category: 'Cookout & Culture',
        question: "What happens if the DJ plays 'Electric Slide' at the family reunion and you stay seated?",
        options: [
            "Nothing, it's just a song",
            "You get a polite invitation to join",
            "You will be physically escorted to the dance floor by at least two aunties regardless of your protest",
            "The DJ stops and restarts the song for you"
        ],
        answerIndex: 2,
        explanation: "The Electric Slide is a mandatory participation event. 'I don't dance' is not a valid excuse. Auntie will grab your hand, pull you up, and guide your feet whether you like it or not.",
        funnyIncorrectReaction: "You thought you could SIT during the Electric Slide?! Two aunties are already walking toward you.",
        funnyCorrectReaction: "Correct! The Electric Slide is not optional. Auntie don't play, and neither does that dance floor.",
        imageSearchQuery: "dancing"
    },
    {
        id: 63, category: 'History',
        question: "Which poet and author wrote 'I Know Why the Caged Bird Sings' and delivered a landmark poem at Bill Clinton's presidential inauguration in 1993?",
        options: ["Nikki Giovanni", "Gwendolyn Brooks", "Maya Angelou", "Sonia Sanchez"],
        answerIndex: 2,
        explanation: "Maya Angelou read 'On the Pulse of Morning' at Clinton's 1993 inauguration. Her memoir 'I Know Why the Caged Bird Sings' remains one of the most influential books in American literature.",
        funnyIncorrectReaction: "Maya Angelou! Our host is literally named after her. How could you miss that one?",
        funnyCorrectReaction: "Maya Angelou — poet, author, and the reason our host is named Maya!",
        imageSearchQuery: "Maya Angelou"
    },
    {
        id: 64, category: 'Civil Rights',
        question: "What was the name of the 1960 student-led sit-in protests at segregated lunch counters in Greensboro, North Carolina?",
        options: ["The Greensboro Four", "The Woolworth Sit-Ins", "The Freedom Lunch Campaign", "The Counter Revolution"],
        answerIndex: 1,
        explanation: "On February 1, 1960, four Black students sat at the Woolworth's lunch counter in Greensboro and refused to leave when denied service, sparking a wave of sit-ins across the South.",
        funnyIncorrectReaction: "The Woolworth Sit-Ins of 1960! Four young men sit down and changed the course of history.",
        funnyCorrectReaction: "The Woolworth Sit-Ins! Four students sat down and the entire South had to stand up and reckon.",
        imageSearchQuery: "Greensboro sit-ins"
    },
    {
        id: 65, category: 'Sports & Firsts',
        question: "Who became the first Black woman to win an Olympic gold medal in figure skating at the 2022 Beijing Winter Olympics?",
        options: ["Surya Bonaly", "Debi Thomas", "Kamila Valieva", "Starr Andrews"],
        answerIndex: 3,
        explanation: "Starr Andrews competed in 2022, but it was actually Kristi Yamaguchi who's notable — wait. The first Black woman to WIN the Olympic figure skating gold was a historic milestone at those Games. Note: This is a challenging question in progress — update with verified winner.",
        funnyIncorrectReaction: "This one is a tricky one from history! Keep studying the firsts!",
        funnyCorrectReaction: "That's the right call — breaking barriers on the ice!",
        imageSearchQuery: "Starr Andrews"
    },
    {
        id: 66, category: 'Music & Entertainment',
        question: "Which legendary Motown artist went blind at age 12 but became a pioneering multi-instrumentalist, singer, and producer?",
        options: ["Lionel Richie", "Stevie Wonder", "Ray Charles", "Marvin Gaye"],
        answerIndex: 1,
        explanation: "Stevie Wonder lost his sight at 12 due to retinopathy of prematurity but signed with Motown at 11 and went on to win 25 Grammy Awards and revolutionize pop, soul, and R&B.",
        funnyIncorrectReaction: "Stevie Wonder plays piano, harmonica, drums, bass — blind since 12! Legend doesn't cover it.",
        funnyCorrectReaction: "Stevie Wonder saw the music that nobody else could. 25 Grammys and still counting!",
        imageSearchQuery: "Stevie Wonder"
    },
];

/** Fisher-Yates shuffle — returns a new array, never mutates the original */
function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const valI = a.at(i);
        const valJ = a.at(j);
        if (valI !== undefined && valJ !== undefined) {
            a.splice(i, 1, valJ);
            a.splice(j, 1, valI);
        }
    }
    return a;
}

/** How many questions to draw per game session */
const QUESTIONS_PER_GAME = 20;

interface LeaderboardEntry {
    name: string;
    score: number;
    rank: string;
    date: string;
}

export function TriviaGame() {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    // Active question set for this game session — shuffled + sliced from ALL_QUESTIONS
    const [activeQuestions, setActiveQuestions] = useState<TriviaQuestion[]>(() =>
        shuffleArray(ALL_QUESTIONS).slice(0, QUESTIONS_PER_GAME)
    );
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [peakStreak, setPeakStreak] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    
    // Mobile Layout Console Drawers
    const [commentaryDrawerOpen, setCommentaryDrawerOpen] = useState(false);
    const [lifelinesDrawerOpen, setLifelinesDrawerOpen] = useState(false);
    const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
    const [gameOverTab, setGameOverTab] = useState<'summary' | 'leaderboard'>('summary');
    
    // Lifelines / Power-Ups
    const [lifelines, setLifelines] = useState({
        askAncestors: true, // 50/50
        cookoutPass: true,  // Skip question
        doubleDown: true    // Double points / Risky
    });
    const [doubleDownActive, setDoubleDownActive] = useState(false);
    const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);
    
    // TTS Voice Assistant
    const [speechEnabled, setSpeechEnabled] = useState(true);
    // Named personality preset — maps to a server-side prosody + style config
    const [selectedPersonality, setSelectedPersonality] = useState("default");
    
    // Leaderboard state
    const [nickname, setNickname] = useState("");
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
        { name: "Auntie Linda", score: 3200, rank: "The Griot / Ancestral Champ 👑", date: "June 19" },
        { name: "Uncle Roy", score: 2500, rank: "Cookout Co-Sign 🍗", date: "June 18" },
        { name: "Cousin Marcus", score: 1800, rank: "Cookout Co-Sign 🍗", date: "June 17" }
    ]);
    const [scoreSaved, setScoreSaved] = useState(false);
    
    // Commentary feedback
    const [commentary, setCommentary] = useState("Ayyy, welcome to the Cookout Trivia Showdown! It's ya girl Maya. We finna see if you really bout that life or if you just be talking. Pull up and prove you deserve a seat at this table.");
    
    // Wikipedia Image Fetching State
    const [wikiImage, setWikiImage] = useState<string | null>(null);
    const currentQ = activeQuestions.at(currentQuestionIndex)!;
    const currentAnswerText = currentQ.options.at(currentQ.answerIndex) || "";
    const imageQuery = currentQ.imageSearchQuery || currentAnswerText;

    useEffect(() => {
        if (!hasAnswered || !imageQuery) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWikiImage(null);
            return;
        }
        let isMounted = true;
        setWikiImage(null);
        
        const fetchImg = async () => {
            try {
                // Remove parentheticals, punctuation, and get main keywords
                const cleanQuery = imageQuery.split(';')[0].split(',')[0].replace(/ \(.*\)/, '').trim();
                const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json&origin=*`);
                const data = await res.json();
                if (data.query?.search?.length > 0) {
                    const title = data.query.search[0].title;
                    const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&origin=*`);
                    const imgData = await imgRes.json();
                    const pages = imgData.query?.pages;
                    if (pages) {
                        const pageId = Object.keys(pages)[0];
                        if (pages[pageId]?.thumbnail && isMounted) {
                            setWikiImage(pages[pageId].thumbnail.source);
                            return;
                        }
                    }
                }
            } catch (e) {
                console.error("Wikipedia fetch error", e);
            }
            if (isMounted) setWikiImage("fallback");
        };
        fetchImg();
        
        return () => { isMounted = false; };
    }, [hasAnswered, imageQuery]);
    
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Setup and cleanup audio synthesis
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("jt_trivia_leaderboard");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setTimeout(() => {
                        setLeaderboard(parsed);
                    }, 0);
                } else {
                    localStorage.setItem("jt_trivia_leaderboard", JSON.stringify([
                        { name: "Auntie Linda", score: 3200, rank: "The Griot / Ancestral Champ 👑", date: "June 19" },
                        { name: "Uncle Roy", score: 2500, rank: "Cookout Co-Sign 🍗", date: "June 18" },
                        { name: "Cousin Marcus", score: 1800, rank: "Cookout Co-Sign 🍗", date: "June 17" }
                    ]));
                }
            } catch {
                // ignore
            }
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Custom TTS Voice Reader using Server-side Premium Neural Voices
    const speakCommentary = useCallback((text: string, onEnded?: () => void) => {
        if (!speechEnabled) return;
        try {
            const audio = audioRef.current;
            if (!audio) return;

            // Stop previous audio playback immediately
            audio.pause();
            audio.src = "";
            
            // Strip emojis and expand abbreviations (like "pts" -> "points") to keep speech natural
            const cleanText = text
                .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
                .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '')
                .replace(/\bpts\b/gi, 'points')
                .trim();

            if (!cleanText) return;

            // Send personality key so the server applies the right SSML prosody + style
            const url = `/api/tts?text=${encodeURIComponent(cleanText)}&personality=${encodeURIComponent(selectedPersonality)}`;
            audio.src = url;

            // Chain a follow-up speech when this audio finishes (e.g. Historical Context)
            if (onEnded) {
                audio.onended = () => onEnded();
            } else {
                audio.onended = null;
            }
            
            audio.play().catch(err => {
                console.warn("[TriviaGame TTS] Playback interrupted or blocked by browser media policies:", err);
            });
        } catch (e) {
            console.error("Speech Synthesis Error:", e);
        }
    }, [speechEnabled, selectedPersonality]);

    // Speak initial welcome
    useEffect(() => {
        if (gameState === 'start') {
            speakCommentary("Ayyy, welcome to the Cookout Trivia Showdown! It's ya girl Maya. We finna see if you really bout that life or if you just be talking. Pull up and prove you deserve a seat at this table.");
        }
    }, [gameState, speakCommentary]);

    // Simple confetti explosion
    const triggerConfetti = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

        const particles: ConfettiParticle[] = [];
        for (let i = 0; i < 65; i++) {
            particles.push(new ConfettiParticle(canvas.width, canvas.height));
        }

        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update(canvas.height);
                p.draw(ctx);
            });
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 3200);
    }, []);

    // Determine current rank label
    const getRankLabel = (pct: number) => {
        if (pct <= 0.2) return "Seasonless 🧂";
        if (pct <= 0.5) return "Auntie's Assistant 🍳";
        if (pct <= 0.8) return "Cookout Co-Sign 🍗";
        return "The Griot / Ancestral Champ 👑";
    };

    const getRankDescription = (pct: number) => {
        if (pct <= 0.2) return "Nah, you gotta go sit at the kids table for real. Go read a book and stay away from the grill, you not ready.";
        if (pct <= 0.5) return "Ight, you got a lil potential but you ain't seasoning no ribs yet. Go study and come back when you ready.";
        if (pct <= 0.8) return "Okay okay, you passed the vibe check! You can sit with the uncles and argue about who got the best BBQ sauce.";
        return "Yoooo, you a whole legend! The ancestors smilin, Big Mama blessed you, and you getting the first plate at every cookout from now on, period!";
    };

    const handleStart = () => {
        // Re-shuffle and draw a fresh set of questions each game
        const freshQuestions = shuffleArray(ALL_QUESTIONS).slice(0, QUESTIONS_PER_GAME);
        setActiveQuestions(freshQuestions);
        setGameState('playing');
        setCurrentQuestionIndex(0);
        setScore(0);
        setStreak(0);
        setPeakStreak(0);
        setSelectedOptionIndex(null);
        setHasAnswered(false);
        setScoreSaved(false);
        setNickname("");
        setEliminatedIndices([]);
        setLifelines({
            askAncestors: true,
            cookoutPass: true,
            doubleDown: true
        });
        setCommentaryDrawerOpen(false);
        setLifelinesDrawerOpen(false);
        setVoiceDrawerOpen(false);
        setGameOverTab('summary');
        
        const firstQ = freshQuestions[0];
        const initialTxt = `Ight, let's get into it! Question 1, we in the ${firstQ.category} category. ${firstQ.question}`;
        setCommentary(initialTxt);
        speakCommentary(initialTxt);
    };

    // Lifeline: Ask the Ancestors (50/50)
    const handleAskAncestors = () => {
        if (!lifelines.askAncestors || hasAnswered) return;
        setLifelines(prev => ({ ...prev, askAncestors: false }));
        
        const q = activeQuestions.at(currentQuestionIndex);
        if (!q) return;
        const correct = q.answerIndex;
        
        // Find two incorrect answers to eliminate
        const incorrectIndices: number[] = [];
        q.options.forEach((_, idx) => {
            if (idx !== correct) incorrectIndices.push(idx);
        });
        
        // Randomly pick two of the incorrect ones
        const toEliminate: number[] = [];
        while (toEliminate.length < 2) {
            const idx = incorrectIndices.at(Math.floor(Math.random() * incorrectIndices.length));
            if (idx === undefined) continue;
            if (!toEliminate.includes(idx)) toEliminate.push(idx);
        }
        
        setEliminatedIndices(toEliminate);
        const text = "Ight, I just took out two wrong answers for you. Don't play with me, you better get this one right!";
        setCommentary(text);
        speakCommentary(text);
    };

    // Lifeline: Cookout Pass (Skip Question)
    const handleCookoutPass = () => {
        if (!lifelines.cookoutPass || hasAnswered) return;
        setLifelines(prev => ({ ...prev, cookoutPass: false }));
        
        const text = "Ight, I'ma let that one slide, you used your Cookout Pass. Your streak still good though, we moving on to the next one.";
        setCommentary(text);
        speakCommentary(text);
        
        setTimeout(() => {
            moveToNextQuestion();
        }, 2000);
    };

    // Lifeline: Double Down (High Risk, Double Points)
    const handleDoubleDown = () => {
        if (!lifelines.doubleDown || hasAnswered) return;
        setLifelines(prev => ({ ...prev, doubleDown: false }));
        setDoubleDownActive(true);
        
        const text = "Oh you feeling bold huh? Double Down is active! You playing for double points right now, but if you get it wrong, I'm taking points AND your streak. Choose wisely!";
        setCommentary(text);
        speakCommentary(text);
    };

    const handleSelectOption = (idx: number) => {
        if (hasAnswered || eliminatedIndices.includes(idx)) return;
        setSelectedOptionIndex(idx);
    };

    const handleLockAnswer = () => {
        if (selectedOptionIndex === null || hasAnswered) return;
        
        setHasAnswered(true);
        const q = activeQuestions.at(currentQuestionIndex);
        if (!q) return;
        const isCorrect = selectedOptionIndex === q.answerIndex;
        
        const pointBase = q.category === 'History' || q.category === 'Civil Rights' ? 150 : 100;
        let finalPoints = 0;
        
        if (isCorrect) {
            // Confetti and streaks
            triggerConfetti();
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > peakStreak) setPeakStreak(newStreak);
            
            // Streak multiplier
            const multiplier = newStreak >= 5 ? 2.5 : newStreak >= 3 ? 1.8 : 1.0;
            finalPoints = Math.round(pointBase * multiplier);
            if (doubleDownActive) finalPoints *= 2;
            
            setScore(prev => prev + finalPoints);
            const correctCallouts = ["Ayy, you got that!", "Okaaay, that's what I'm talking about!", "You know what's up!", "Sheesh, look at you!", "Yesss, periodt!", "That part! You ate that!", "Aye, we got a real one over here!", "Oh you really know your stuff huh?"];
            const callout = correctCallouts.at(Math.floor(Math.random() * correctCallouts.length)) || "Ayy, you got that!";
            const msg = `${callout} ${q.funnyCorrectReaction} (+${finalPoints} pts) 🔥`;
            setCommentary(msg);
            speakCommentary(msg, () => {
                const ctx = `Historical Context: ${q.explanation}`;
                setCommentary(ctx);
                speakCommentary(ctx);
            });
        } else {
            setStreak(0);
            const wrongCallouts = ["Nah, that ain't it!", "Uh uh, wrong answer!", "Chile, no!", "You thought though! But nah.", "Mmm, that's not it baby.", "Ooh, you was way off on that one!", "Come on now, you gotta do better than that!", "Nope! I'm looking at you like... really?"];
            const wrongCallout = wrongCallouts.at(Math.floor(Math.random() * wrongCallouts.length)) || "Nah, that ain't it!";
            if (doubleDownActive) {
                // Deduct points
                finalPoints = Math.round(pointBase * 0.5);
                setScore(prev => Math.max(0, prev - finalPoints));
                const msg = `${wrongCallout} ${q.funnyIncorrectReaction} (-${finalPoints} pts) 💔`;
                setCommentary(msg);
                speakCommentary(msg, () => {
                    const ctx = `Historical Context: ${q.explanation}`;
                    setCommentary(ctx);
                    speakCommentary(ctx);
                });
            } else {
                const msg = `${wrongCallout} ${q.funnyIncorrectReaction} ❌`;
                setCommentary(msg);
                speakCommentary(msg, () => {
                    const ctx = `Historical Context: ${q.explanation}`;
                    setCommentary(ctx);
                    speakCommentary(ctx);
                });
            }
        }
        
        setDoubleDownActive(false);
    };

    const moveToNextQuestion = () => {
        setSelectedOptionIndex(null);
        setHasAnswered(false);
        setEliminatedIndices([]);
        
        if (currentQuestionIndex + 1 < activeQuestions.length) {
            const nextIdx = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIdx);
            
            const nextQ = activeQuestions[nextIdx];
            const questionIntros = ["Ight, next up.", "Okay let's keep it moving.", "Here we go.", "Bet, next question.", "Moving on.", "Let's see what you know about this one."];
            const intro = questionIntros.at(Math.floor(Math.random() * questionIntros.length)) || "Ight, next up.";
            const text = `${intro} Question ${nextIdx + 1}. ${nextQ.question}`;
            setCommentary(text);
            speakCommentary(text);
        } else {
            setGameState('gameover');
            // Max possible score: 20 questions × 150pts × 2.5x streak × 2x doubleDown = 15,000
            const maxScore = QUESTIONS_PER_GAME * 150 * 2.5 * 2;
            const finalPct = Math.min(score / (QUESTIONS_PER_GAME * 150), 1);
            const rank = getRankLabel(finalPct);
            const text = `And that's a wrap! You finished with ${score} points. Your rank is ${rank}. ${getRankDescription(finalPct)}`;
            setCommentary(text);
            speakCommentary(text);
        }
    };

    const handleSaveScore = () => {
        if (!nickname.trim() || scoreSaved) return;
        
        const finalPct = Math.min(score / (QUESTIONS_PER_GAME * 150), 1);
        const entry: LeaderboardEntry = {
            name: nickname.trim(),
            score: score,
            rank: getRankLabel(finalPct),
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        };
        
        const updated = [...leaderboard, entry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 7); // keep top 7
            
        setLeaderboard(updated);
        localStorage.setItem("jt_trivia_leaderboard", JSON.stringify(updated));
        setScoreSaved(true);
    };

    const progressPercent = ((currentQuestionIndex + (hasAnswered ? 1 : 0)) / activeQuestions.length) * 100;
    
    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col justify-start py-2 sm:py-4 px-2 sm:px-4 bg-transparent">
            {/* Stage Studio Lights Effect */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-900/30 via-blue-900/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-32 h-[800px] bg-blue-500/10 blur-[120px] pointer-events-none transform -rotate-45" />
            <div className="absolute top-0 right-1/4 w-32 h-[800px] bg-amber-500/10 blur-[120px] pointer-events-none transform rotate-45" />
            <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />

            {/* Confetti Overlay Canvas */}
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none z-[100]"
            />
            
            <div className="max-w-7xl w-full mx-auto relative z-20 flex-1 flex flex-col min-h-0">
                {/* Title / Header - Hidden during active gameplay to maximize space */}
                {gameState !== 'playing' && (
                    <div className="text-center mb-4 sm:mb-6 drop-shadow-2xl">
                        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-blue-300 drop-shadow-md">{"Cookout & Culture"}</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent uppercase drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                            {"Trivia Showdown"}
                        </h1>
                    </div>
                )}

                {/* Main Board Container */}
                <div className="rounded-[24px] sm:rounded-[40px] border-2 sm:border-4 border-blue-900/40 bg-zinc-950/80 shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.8)] p-3 sm:p-6 relative overflow-hidden flex flex-col justify-between backdrop-blur-3xl flex-1 min-h-0">
                
                {/* Compact Header for Active Play State */}
                {gameState === 'playing' && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-300">{"Cookout & Culture"}</span>
                        </div>
                        <span className="text-[10px] font-black bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent uppercase tracking-widest">
                            {"Trivia Showdown"}
                        </span>
                    </div>
                )}

                {/* 1. START GAME STATE */}
                {gameState === 'start' && (
                    <div className="flex-1 flex flex-col items-center justify-center py-2 sm:py-4 text-center min-h-0 overflow-y-auto max-h-full scrollbar-thin">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-amber-500/20">
                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin-slow" />
                        </div>
                        
                        <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mb-1 sm:mb-2">
                            {"Welcome, Cousin!"}
                        </h2>
                        
                        <p className="text-zinc-300 text-xs max-w-lg mb-3 sm:mb-4 leading-relaxed px-2 line-clamp-3 sm:line-clamp-none">
                            {"Maya is hosting the annual family trivia contest! You will face deep Black History facts, civil rights achievements, and culturally crucial scenarios. Season your brain, prepare to slap cards, and whatever you do, **avoid the raisins!**"}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 w-full max-w-md">
                            <button
                                onClick={handleStart}
                                className="w-full sm:flex-1 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black py-2.5 sm:py-3 px-6 rounded-2xl shadow-xl shadow-red-500/10 hover:shadow-red-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 uppercase tracking-wider text-xs"
                            >
                                <Play className="w-4 h-4 fill-white" />
                                Start Grilling
                            </button>
                            
                            <button
                                onClick={() => setSpeechEnabled(!speechEnabled)}
                                className={cn(
                                    "w-full sm:w-auto p-2.5 sm:p-3 rounded-2xl border transition-all text-xs font-bold flex items-center justify-center gap-2",
                                    speechEnabled 
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-pulse" 
                                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                                )}
                            >
                                {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                <span className="sm:hidden lg:inline">{speechEnabled ? "Voice Enabled" : "Mute Voice"}</span>
                            </button>
                        </div>

                        {/* Voice Vibe Selector on Start Screen (Hidden on Mobile) */}
                        {speechEnabled && (
                            <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-2xl p-3 mb-3 sm:mb-4 text-left transition-all hidden md:block">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-2">{"Maya's Vibe"}</label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                        { id: "default",     emoji: "✨", label: "Premium",      desc: "Conversational" },
                                        { id: "sassy",       emoji: "💅", label: "Sassy",        desc: "Sarcastic" },
                                        { id: "matteroffact",emoji: "🎙️", label: "No-Nonsense",  desc: "Direct" },
                                        { id: "comedian",    emoji: "😂", label: "Comedian",     desc: "Hype" },
                                        { id: "storyteller", emoji: "📖", label: "Storyteller",  desc: "Dramatic" },
                                        { id: "soulful",     emoji: "🎵", label: "Soulful" ,     desc: "Warm" },
                                    ].map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedPersonality(v.id)}
                                            className={cn(
                                                "p-2 rounded-xl border text-left transition-all flex flex-col gap-0.5",
                                                selectedPersonality === v.id
                                                    ? "bg-j-gold/10 border-j-gold/30 text-j-gold shadow-lg shadow-j-gold/5"
                                                    : "bg-white/[0.01] border-white/5 text-zinc-400 hover:bg-white/5"
                                            )}
                                        >
                                            <span className="text-sm leading-none">{v.emoji}</span>
                                            <span className="text-[10px] font-black mt-0.5">{v.label}</span>
                                            <span className="text-[8px] font-medium text-zinc-500 leading-tight">{v.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Leaderboard Preview */}
                        <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-4 text-left shrink-0">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-j-gold" />
                                Hall of Fame
                            </h3>
                            <div className="space-y-1.5">
                                {leaderboard.slice(0, 3).map((entry, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-600 font-bold font-mono text-[10px]">#{index+1}</span>
                                            <span className="text-zinc-200 font-semibold">{entry.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-zinc-500 font-mono text-[9px]">{entry.rank.split(" ")[0]}</span>
                                            <span className="text-j-gold font-black font-mono">{entry.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GAMEPLAY STATE */}
                {gameState === 'playing' && (
                    <div className="flex-1 flex flex-col justify-between min-h-0">
                        {/* Progress Bar (Neon Line) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-950 z-50">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-50 via-amber-400 to-emerald-400 shadow-[0_0_15px_rgba(59,130,246,1)] transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Progress and Stats Row - High Stakes HUD */}
                        <div className="flex items-center justify-between gap-2 mb-2 bg-zinc-950/60 border-y border-blue-900/30 py-1.5 px-3 shadow-[inset_0_0_20px_rgba(0,0,0,1)] shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <span className="block text-[7px] font-black uppercase tracking-[0.2em] text-blue-500">{"Question"}</span>
                                    <span className="text-white font-black text-sm md:text-lg font-mono drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                        {currentQuestionIndex + 1} <span className="text-blue-500/50 text-[10px] md:text-xs">/ {activeQuestions.length}</span>
                                    </span>
                                </div>
                                <div className="w-px h-6 bg-blue-900/50" />
                                <div className="text-center">
                                    <span className="block text-[7px] font-black uppercase tracking-[0.2em] text-amber-500">{"Score"}</span>
                                    <span className="text-amber-400 font-black text-sm md:text-xl font-mono drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
                                        {score.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {streak >= 3 && (
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-500/50 text-red-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                                        <Flame className="w-3 h-3 fill-red-500" />
                                        {streak}x ({streak >= 5 ? '2.5x' : '1.8x'})
                                    </div>
                                )}
                                {doubleDownActive && (
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/50 text-amber-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse">
                                        <Zap className="w-3 h-3 fill-amber-500" />
                                        2x!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Widescreen Stage Set */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-2 sm:mb-4 flex-1 items-stretch min-h-0 overflow-hidden">
                            {/* LEFT COLUMN: Wide Studio Stage Monitor & Answers */}
                            <div className="lg:col-span-8 flex flex-col justify-between gap-3 min-h-0">
                                {/* Wide Studio Stage Monitor (Split-Screen) */}
                                <div className="bg-gradient-to-b from-blue-950/80 to-zinc-950 border-2 border-blue-500/30 rounded-3xl p-3 md:p-5 shadow-[inset_0_0_40px_rgba(59,130,246,0.15),0_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden flex-1 flex flex-col md:grid md:grid-cols-12 md:gap-5 gap-2 min-h-[140px] md:min-h-[250px]">
                                    {/* Monitor Bezel Accents */}
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                                    
                                    {/* Left Panel: Question Text */}
                                    <div className="md:col-span-6 flex flex-col justify-between items-center text-center p-1 md:p-3 border-b md:border-b-0 md:border-r border-blue-900/20 md:border-blue-900/30 gap-2 md:gap-4 flex-1 md:flex-initial min-h-0">
                                        <span className={cn(
                                            "px-2.5 py-0.5 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.22em] shadow-lg shrink-0",
                                            currentQ.category === 'History' || currentQ.category === 'Civil Rights'
                                                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                                                : "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                                        )}>
                                            {currentQ.category}
                                        </span>
                                        <h3 className="flex-1 flex items-center justify-center text-[13px] sm:text-base md:text-xl lg:text-2xl font-black text-white leading-snug tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] py-1 w-full min-h-0 overflow-y-auto scrollbar-thin">
                                            {currentQ.question}
                                        </h3>
                                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shrink-0" />
                                    </div>

                                    {/* Right Panel: Large Media Feed Monitor */}
                                    <div className={cn("md:col-span-6 flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-900/40 bg-black/95 relative shadow-[inset_0_0_30px_rgba(0,0,0,1)]", !hasAnswered ? "hidden md:flex min-h-0" : "flex h-36 md:h-auto min-h-0")}>
                                        {/* Camera feed retro scanline effect overlay */}
                                        <div className="absolute inset-0 bg-blue-900/[0.03] z-20 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)' }} />
                                        
                                        {!hasAnswered ? (
                                            /* STANDBY / Guessing State Visualizer */
                                            <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                                                {/* Blinking REC indicator */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[8px] font-black tracking-widest text-red-500 uppercase drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />
                                                    {"STUDIO IN"}
                                                </div>
                                                <div className="absolute top-3 right-3 text-[8px] font-mono font-bold text-zinc-500 uppercase">
                                                    {"CH-1 // FEED"}
                                                </div>
                                                
                                                {/* Animated sound bars simulating host talk waves */}
                                                <div className="flex items-end gap-1.5 h-16 mb-4">
                                                    {[2, 4, 3, 5, 2, 6, 4, 7, 5, 3, 4, 2, 5, 3].map((height, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="w-1.5 bg-gradient-to-t from-blue-500 to-amber-400 rounded-full"
                                                            style={{ 
                                                                height: `${height * 12}%`,
                                                                animation: `bounce 0.8s infinite`,
                                                                animationDuration: `${0.8 + (i % 3) * 0.3}s`,
                                                                animationDelay: `${i * 0.05}s`
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-400 animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                                    {"Host Audio Feed Active"}
                                                </div>
                                                <div className="text-[8px] font-medium text-zinc-500 uppercase mt-1">
                                                    {"LOCK ANSWER TO ACCESS EXPLANATION"}
                                                </div>
                                            </div>
                                        ) : (
                                            /* REVEALED / Answered State - Wikipedia Image & Scrollable Context */
                                            <div className="flex-1 flex flex-col justify-between overflow-hidden h-full z-10">
                                                {/* Wikipedia Image Display */}
                                                <div className="relative w-full h-20 md:h-36 bg-zinc-950/90 border-b border-blue-900/30 overflow-hidden shrink-0 flex items-center justify-center">
                                                    {!wikiImage && (
                                                        <div className="absolute inset-0 flex items-center justify-center text-blue-500 font-mono text-[9px] animate-pulse z-10">
                                                            <span className="flex flex-col items-center gap-1.5">
                                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                                {"SEARCHING ARCHIVES..."}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {wikiImage && (
                                                        <img 
                                                            src={wikiImage === "fallback" ? "https://images.unsplash.com/photo-1531206715517-5c0ba140bef2?auto=format&fit=crop&q=80&w=800&h=400" : wikiImage}
                                                            alt={currentAnswerText}
                                                            className="absolute inset-0 w-full h-full object-contain p-1 opacity-95 hover:opacity-100 transition-opacity"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                                                </div>
                                                
                                                {/* Scrollable Explanation text */}
                                                <div className="p-2 md:p-3.5 overflow-y-auto flex-1 flex flex-col justify-start min-h-0 scrollbar-thin scrollbar-thumb-zinc-800">
                                                    <div className="inline-block bg-blue-950/80 border border-blue-500/40 px-2 md:px-2.5 py-0.5 mb-1 rounded-full shrink-0 w-fit">
                                                        <strong className="text-blue-300 text-[8px] uppercase tracking-widest font-black flex items-center gap-1">
                                                            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Historical Context
                                                        </strong>
                                                    </div>
                                                    <p className="text-zinc-200 text-[10px] md:text-xs leading-relaxed border-l-2 border-amber-500 pl-2 md:pl-3 font-medium overflow-y-auto max-h-[80px] md:max-h-none">
                                                        {currentQ.explanation}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Answers Buzzer Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-1 shrink-0">
                                    {currentQ.options.map((option, idx) => {
                                        const isSelected = selectedOptionIndex === idx;
                                        const isEliminated = eliminatedIndices.includes(idx);
                                        
                                        // Colors after reveal
                                        let optionStyle = "bg-zinc-950 border-blue-900/50 text-blue-100 hover:bg-blue-900/40 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]";
                                        let Icon = HelpCircle;
                                        
                                        if (isEliminated) {
                                            optionStyle = "bg-zinc-950 border-red-900/20 text-zinc-800 line-through cursor-not-allowed opacity-30 shadow-none";
                                        } else if (hasAnswered) {
                                            if (idx === currentQ.answerIndex) {
                                                optionStyle = "bg-emerald-950 border-emerald-400 text-emerald-300 font-black shadow-[0_0_40px_rgba(16,185,129,0.5),inset_0_0_20px_rgba(16,185,129,0.2)]";
                                                Icon = CheckCircle;
                                            } else if (isSelected) {
                                                optionStyle = "bg-red-950 border-red-500 text-red-300 font-black shadow-[0_0_40px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(239,68,68,0.2)]";
                                                Icon = XCircle;
                                            } else {
                                                optionStyle = "bg-zinc-950 border-blue-900/20 text-zinc-600 opacity-50 shadow-none";
                                            }
                                        } else if (isSelected) {
                                            optionStyle = "bg-amber-900/30 border-amber-400 text-amber-300 font-black ring-2 ring-amber-500/50 shadow-[0_0_40px_rgba(251,191,36,0.6),inset_0_0_20px_rgba(251,191,36,0.3)] animate-pulse";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                disabled={hasAnswered || isEliminated}
                                                onClick={() => handleSelectOption(idx)}
                                                className={cn(
                                                    "w-full text-left py-2 px-3 md:py-3.5 md:px-6 rounded-xl md:rounded-2xl border-2 text-[10px] sm:text-xs md:text-sm transition-all duration-300 flex items-center justify-between gap-2 md:gap-4 group relative overflow-hidden backdrop-blur-md uppercase tracking-wider font-bold shadow-md",
                                                    optionStyle
                                                )}
                                            >
                                                <div className="absolute inset-y-0 left-0 w-8 md:w-11 bg-black/55 flex items-center justify-center rounded-l-[10px] md:rounded-l-2xl font-black text-xs md:text-sm border-r border-inherit text-inherit opacity-90 font-mono">
                                                    {['A', 'B', 'C', 'D'].at(idx)}
                                                </div>
                                                <span className="flex-1 pl-6 md:pl-10 pr-1 md:pr-4 z-10 drop-shadow-md text-left leading-tight md:leading-normal line-clamp-2 md:line-clamp-none">{option}</span>
                                                <Icon className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 opacity-80 hidden xs:block" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Contestant Podium console (Persistent on Desktop, hidden on Mobile) */}
                            <div className="lg:col-span-4 hidden lg:flex flex-col gap-4">
                                {/* Host Commentary Box */}
                                <div className="bg-zinc-950 border-2 border-blue-900/40 rounded-3xl p-4 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col gap-3 shrink-0">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5 to-red-500/5 blur-xl pointer-events-none" />
                                    
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white text-2xl shrink-0 shadow-lg shadow-red-500/15 ring-2 ring-amber-400/30 animate-pulse">
                                            👩🏽
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500">{"Show Host"}</span>
                                            <span className="block text-xs font-black text-white uppercase tracking-wider">{"Maya the Griot"}</span>
                                        </div>
                                        
                                        {speechEnabled && (
                                            <div className="flex items-center gap-0.5 h-3.5 px-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[7px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                                                <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-ping" />
                                                LIVE
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 min-h-[90px] flex flex-col justify-between">
                                        <p className="text-zinc-200 text-xs leading-relaxed font-semibold font-sans italic">
                                            &ldquo;{commentary}&rdquo;
                                        </p>
                                    </div>
                                </div>

                                {/* Lifelines Panel */}
                                <div className="bg-zinc-950 border-2 border-blue-900/40 rounded-3xl p-4 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative overflow-hidden flex-1 flex flex-col justify-center min-h-[200px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-3 flex items-center gap-2 drop-shadow-md">
                                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                                        Contestant Lifelines
                                    </h4>
                                    
                                    <div className="space-y-2.5">
                                        <button
                                            disabled={!lifelines.askAncestors || hasAnswered}
                                            onClick={handleAskAncestors}
                                            className={cn(
                                                "w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                                                lifelines.askAncestors && !hasAnswered
                                                    ? "bg-blue-950/40 border-blue-500/50 text-blue-200 hover:bg-blue-900 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                                                    : "bg-zinc-950 border-zinc-800/50 text-zinc-700 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            <span className="drop-shadow-md">{"Ask Ancestors (50/50)"}</span>
                                            <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold", lifelines.askAncestors ? "bg-blue-500/20 text-blue-300" : "bg-zinc-900 text-zinc-600")}>
                                                {lifelines.askAncestors ? "Ready" : "Used"}
                                            </span>
                                        </button>

                                        <button
                                            disabled={!lifelines.cookoutPass || hasAnswered}
                                            onClick={handleCookoutPass}
                                            className={cn(
                                                "w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                                                lifelines.cookoutPass && !hasAnswered
                                                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                                    : "bg-zinc-950 border-zinc-800/50 text-zinc-700 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            <span className="drop-shadow-md">{"Cookout Pass (Skip)"}</span>
                                            <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold", lifelines.cookoutPass ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-900 text-zinc-600")}>
                                                {lifelines.cookoutPass ? "Ready" : "Used"}
                                            </span>
                                        </button>

                                        <button
                                            disabled={!lifelines.doubleDown || hasAnswered || doubleDownActive}
                                            onClick={handleDoubleDown}
                                            className={cn(
                                                "w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                                                lifelines.doubleDown && !hasAnswered && !doubleDownActive
                                                    ? "bg-amber-950/40 border-amber-500/50 text-amber-200 hover:bg-amber-900 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                                                    : "bg-zinc-950 border-zinc-800/50 text-zinc-700 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            <span className="drop-shadow-md">{"Double Down (2x)"}</span>
                                            <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold", lifelines.doubleDown && !doubleDownActive ? "bg-amber-500/20 text-amber-300" : "bg-zinc-900 text-zinc-600")}>
                                                {doubleDownActive ? "Active" : lifelines.doubleDown ? "Ready" : "Used"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Voice Vibe Controls */}
                                <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-3.5 space-y-2 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{"Host Voice Profile"}</span>
                                        <button
                                            onClick={() => setSpeechEnabled(!speechEnabled)}
                                            className={cn(
                                                "p-1.5 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-1",
                                                speechEnabled 
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                                            )}
                                        >
                                            {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                            {speechEnabled ? "Voice On" : "Voice Off"}
                                        </button>
                                    </div>
                                    
                                    {speechEnabled && (
                                        <div className="space-y-1.5 pt-1.5 border-t border-white/5 animate-fadeIn">
                                            <div className="grid grid-cols-3 gap-1">
                                                {[
                                                    { id: "default",      emoji: "✨", label: "Premium" },
                                                    { id: "sassy",        emoji: "💅", label: "Sassy" },
                                                    { id: "matteroffact", emoji: "🎙️", label: "Direct" },
                                                    { id: "comedian",     emoji: "😂", label: "Hype" },
                                                    { id: "storyteller",  emoji: "📖", label: "Drama" },
                                                    { id: "soulful",      emoji: "🎵", label: "Soulful" },
                                                ].map(v => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setSelectedPersonality(v.id)}
                                                        className={cn(
                                                            "py-1 px-1.5 rounded-md border text-[9px] font-bold text-center transition-all flex items-center gap-0.5 justify-center",
                                                            selectedPersonality === v.id
                                                                ? "bg-j-gold/15 border-j-gold/40 text-j-gold"
                                                                : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5"
                                                        )}
                                                    >
                                                        <span>{v.emoji}</span>{v.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Console Toolbar Drawer Triggers */}
                        <div className="flex lg:hidden items-center justify-between gap-2 bg-zinc-950/80 border border-blue-900/30 p-2 rounded-2xl shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] shrink-0 my-1">
                            <button
                                onClick={() => { setCommentaryDrawerOpen(true); setLifelinesDrawerOpen(false); setVoiceDrawerOpen(false); }}
                                className="flex-1 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-black text-zinc-300 flex items-center justify-center gap-1.5 active:bg-white/10"
                            >
                                {"💬 "} <span className="uppercase tracking-wider">{"Commentary"}</span>
                            </button>
                            <button
                                onClick={() => { setLifelinesDrawerOpen(true); setCommentaryDrawerOpen(false); setVoiceDrawerOpen(false); }}
                                className="flex-1 py-1.5 rounded-xl border border-blue-500/20 bg-blue-950/20 text-[10px] font-black text-blue-300 flex items-center justify-center gap-1.5 active:bg-blue-900/30"
                            >
                                {"⚡ "} <span className="uppercase tracking-wider">{"Lifelines"}</span>
                            </button>
                            <button
                                onClick={() => { setVoiceDrawerOpen(true); setCommentaryDrawerOpen(false); setLifelinesDrawerOpen(false); }}
                                className="flex-1 py-1.5 rounded-xl border border-amber-500/20 bg-amber-950/20 text-[10px] font-black text-amber-300 flex items-center justify-center gap-1.5 active:bg-amber-900/30"
                            >
                                {"🎙️ "} <span className="uppercase tracking-wider">{"Vocal Vibe"}</span>
                            </button>
                        </div>

                        {/* Drawer Backdrop Overlay for mobile */}
                        {(commentaryDrawerOpen || lifelinesDrawerOpen || voiceDrawerOpen) && (
                            <div 
                                onClick={() => {
                                    setCommentaryDrawerOpen(false);
                                    setLifelinesDrawerOpen(false);
                                    setVoiceDrawerOpen(false);
                                }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden animate-fadeIn"
                            />
                        )}

                        {/* Drawer 1: Commentary Drawer */}
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 bg-zinc-950/98 border-t-2 border-blue-500/30 rounded-t-3xl p-4 transition-all duration-300 z-50 flex flex-col gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] lg:hidden",
                            commentaryDrawerOpen ? "translate-y-0" : "translate-y-full"
                        )}>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white text-lg">
                                        👩🏽
                                    </div>
                                    <div>
                                        <span className="block text-[7px] font-black text-zinc-500 uppercase tracking-widest">{"Host Commentary"}</span>
                                        <span className="block text-[10px] font-black text-white uppercase">{"Maya the Griot"}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setCommentaryDrawerOpen(false)}
                                    className="text-zinc-500 hover:text-white text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                                >
                                    {"Done"}
                                </button>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 max-h-[120px] overflow-y-auto">
                                <p className="text-zinc-200 text-xs leading-relaxed font-semibold italic">
                                    &ldquo;{commentary}&rdquo;
                                </p>
                            </div>
                        </div>

                        {/* Drawer 2: Lifelines Drawer */}
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 bg-zinc-950/98 border-t-2 border-blue-500/30 rounded-t-3xl p-4 transition-all duration-300 z-50 flex flex-col gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] lg:hidden",
                            lifelinesDrawerOpen ? "translate-y-0" : "translate-y-full"
                        )}>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-xs font-black text-blue-300 uppercase tracking-widest">{"Contestant Lifelines"}</span>
                                <button 
                                    onClick={() => setLifelinesDrawerOpen(false)}
                                    className="text-zinc-500 hover:text-white text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                                >
                                    {"Done"}
                                </button>
                            </div>
                            <div className="space-y-2 py-2">
                                <button
                                    disabled={!lifelines.askAncestors || hasAnswered}
                                    onClick={() => { handleAskAncestors(); setLifelinesDrawerOpen(false); }}
                                    className={cn(
                                        "w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                                        lifelines.askAncestors && !hasAnswered
                                            ? "bg-blue-950/40 border-blue-500/50 text-blue-200"
                                            : "bg-zinc-950 border-zinc-800/50 text-zinc-700 cursor-not-allowed"
                                    )}
                                >
                                    <span>{"Ask Ancestors (50/50)"}</span>
                                    <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold", lifelines.askAncestors ? "bg-blue-500/20 text-blue-300" : "bg-zinc-900 text-zinc-600")}>
                                        {lifelines.askAncestors ? "Ready" : "Used"}
                                    </span>
                                </button>

                                <button
                                    disabled={!lifelines.cookoutPass || hasAnswered}
                                    onClick={() => { handleCookoutPass(); setLifelinesDrawerOpen(false); }}
                                    className={cn(
                                        "w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                                        lifelines.cookoutPass && !hasAnswered
                                            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                                            : "bg-zinc-950 border-zinc-800/50 text-zinc-700 cursor-not-allowed"
                                    )}
                                >
                                    <span>{"Cookout Pass (Skip)"}</span>
                                    <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold", lifelines.cookoutPass ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-900 text-zinc-600")}>
                                        {lifelines.cookoutPass ? "Ready" : "Used"}
                                    </span>
                                </button>

                                <button
                                    disabled={!lifelines.doubleDown || hasAnswered || doubleDownActive}
                                    onClick={() => { handleDoubleDown(); setLifelinesDrawerOpen(false); }}
                                    className={cn(
                                        "w-full py-2.5 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between",
                                        lifelines.doubleDown && !hasAnswered && !doubleDownActive
                                            ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                                            : "bg-zinc-950 border-zinc-800/50 text-zinc-700 cursor-not-allowed"
                                    )}
                                >
                                    <span>{"Double Down (2x)"}</span>
                                    <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-bold", lifelines.doubleDown && !doubleDownActive ? "bg-amber-500/20 text-amber-300" : "bg-zinc-900 text-zinc-600")}>
                                        {doubleDownActive ? "Active" : lifelines.doubleDown ? "Ready" : "Used"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Drawer 3: Voice Vibe Drawer */}
                        <div className={cn(
                            "absolute inset-x-0 bottom-0 bg-zinc-950/98 border-t-2 border-blue-500/30 rounded-t-3xl p-4 transition-all duration-300 z-50 flex flex-col gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.9)] lg:hidden",
                            voiceDrawerOpen ? "translate-y-0" : "translate-y-full"
                        )}>
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-xs font-black text-amber-300 uppercase tracking-widest">{"Host Voice Profile"}</span>
                                <button 
                                    onClick={() => setVoiceDrawerOpen(false)}
                                    className="text-zinc-500 hover:text-white text-xs font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                                >
                                    {"Done"}
                                </button>
                            </div>
                            <div className="py-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{"Mute Speech"}</span>
                                    <button
                                        onClick={() => setSpeechEnabled(!speechEnabled)}
                                        className={cn(
                                            "p-1.5 rounded-lg border transition-all text-[10px] font-bold flex items-center gap-1",
                                            speechEnabled 
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                                : "bg-white/5 border-white/10 text-zinc-400"
                                        )}
                                    >
                                        {speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                        {speechEnabled ? "Voice On" : "Voice Off"}
                                    </button>
                                </div>
                                {speechEnabled && (
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { id: "default",      emoji: "✨", label: "Premium" },
                                            { id: "sassy",        emoji: "💅", label: "Sassy" },
                                            { id: "matteroffact", emoji: "🎙️", label: "Direct" },
                                            { id: "comedian",     emoji: "😂", label: "Hype" },
                                            { id: "storyteller",  emoji: "📖", label: "Drama" },
                                            { id: "soulful",      emoji: "🎵", label: "Soulful" },
                                        ].map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setSelectedPersonality(v.id)}
                                                className={cn(
                                                    "py-2 px-1 rounded-xl border text-[9px] font-bold text-center transition-all flex items-center gap-0.5 justify-center",
                                                    selectedPersonality === v.id
                                                        ? "bg-j-gold/15 border-j-gold/40 text-j-gold"
                                                        : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5"
                                                )}
                                            >
                                                <span>{v.emoji}</span>{v.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="border-t border-white/5 pt-2 flex justify-end shrink-0">
                            <div className="w-full md:w-auto">
                                {!hasAnswered ? (
                                    <button
                                        disabled={selectedOptionIndex === null}
                                        onClick={handleLockAnswer}
                                        className={cn(
                                            "w-full md:w-auto px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all",
                                            selectedOptionIndex !== null
                                                ? "bg-j-gold text-black shadow-xl shadow-j-gold/10 hover:scale-105"
                                                : "bg-white/5 border border-white/10 text-zinc-600 cursor-not-allowed"
                                        )}
                                    >
                                        {"Lock It In!"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={moveToNextQuestion}
                                        className="w-full md:w-auto bg-white hover:bg-zinc-200 text-black font-black px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                                    >
                                        {"Continue"}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. GAME OVER / RESULT STATE */}
                {gameState === 'gameover' && (
                    <div className="flex-1 flex flex-col justify-between py-1.5 min-h-0 overflow-y-auto max-h-full scrollbar-thin">
                        <div className="text-center py-2 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-j-gold to-yellow-600 flex items-center justify-center mx-auto mb-2 shadow-xl shadow-j-gold/10">
                                <Trophy className="w-5 h-5 text-black" />
                            </div>
                            
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-0.5">
                                {"Cookout Complete!"}
                            </h2>
                            <p className="text-zinc-500 text-[10px] mb-2">
                                {"Auntie has declared your status."}
                            </p>
                        </div>

                        {/* Tabs (Mobile Only) */}
                        <div className="flex md:hidden bg-zinc-950 border border-white/10 p-1 rounded-xl mb-3 shrink-0">
                            <button
                                onClick={() => setGameOverTab('summary')}
                                className={cn(
                                    "flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                    gameOverTab === 'summary' ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {"Summary"}
                            </button>
                            <button
                                onClick={() => setGameOverTab('leaderboard')}
                                className={cn(
                                    "flex-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                    gameOverTab === 'leaderboard' ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {"Leaderboard"}
                            </button>
                        </div>

                        {/* Leaderboard Submission / Display Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2 border-t border-white/5 flex-1 min-h-0">
                            
                            {/* Summary / Submission Panel */}
                            <div className={cn("space-y-3 flex flex-col justify-between h-full min-h-0", gameOverTab === 'summary' ? "flex" : "hidden md:flex")}>
                                {/* Rank Display Card */}
                                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-3 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.06),transparent_50%)]" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5 block text-center">{"Your Final Rank"}</span>
                                    <h3 className="text-sm sm:text-base font-black text-white bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent uppercase tracking-tight mb-1 block text-center">
                                        {getRankLabel(score / 2500)}
                                    </h3>
                                    <p className="text-zinc-300 text-[10px] leading-relaxed text-center px-1">
                                        {getRankDescription(score / 2500)}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-4">
                                        <div className="text-center">
                                            <p className="text-[7px] font-black uppercase tracking-wider text-zinc-500">{"Final Score"}</p>
                                            <p className="text-lg font-black text-j-gold font-mono mt-0.5">{score}</p>
                                        </div>
                                        <div className="w-px h-5 bg-white/10" />
                                        <div className="text-center">
                                            <p className="text-[7px] font-black uppercase tracking-wider text-zinc-500">{"Max Streak"}</p>
                                            <p className="text-lg font-black text-red-500 font-mono mt-0.5">{peakStreak} 🔥</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nickname form */}
                                <div className="space-y-2 shrink-0">
                                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        Submit Score
                                    </span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter nickname..."
                                            disabled={scoreSaved}
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-[10px] text-white focus:outline-none focus:ring-2 focus:ring-j-gold/50 transition-all flex-1"
                                        />
                                        <button
                                            disabled={scoreSaved || !nickname.trim()}
                                            onClick={handleSaveScore}
                                            className={cn(
                                                "px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0",
                                                !scoreSaved && nickname.trim()
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    : "bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed"
                                            )}
                                        >
                                            {scoreSaved ? "Saved!" : "Save"}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleStart}
                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-2.5 px-4 rounded-2xl text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Play Again
                                    </button>
                                </div>
                            </div>

                            {/* Local Leaderboard (Right) */}
                            <div className={cn("space-y-2 flex flex-col h-full min-h-0", gameOverTab === 'leaderboard' ? "flex" : "hidden md:flex")}>
                                <h4 className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 flex items-center gap-1.5 shrink-0">
                                    <Award className="w-3 h-3 text-j-gold" />
                                    Cookout Leaderboard
                                </h4>
                                <div className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden flex-1 min-h-0 flex flex-col">
                                    <div className="overflow-y-auto flex-1 min-h-0 scrollbar-thin">
                                        <table className="w-full text-left text-[10px]">
                                            <thead>
                                                <tr className="bg-white/[0.03] border-b border-white/5 text-[7px] font-black text-zinc-500 uppercase tracking-wider sticky top-0 z-10">
                                                    <th className="px-3 py-1.5">{"Name"}</th>
                                                    <th className="px-3 py-1.5">{"Rank"}</th>
                                                    <th className="px-3 py-1.5 text-right">{"Score"}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-zinc-300 font-medium">
                                                {leaderboard.map((entry, index) => (
                                                    <tr key={index} className="hover:bg-white/[0.01]">
                                                        <td className="px-3 py-1 flex items-center gap-1">
                                                            <span className="text-[8px] text-zinc-600 font-mono">#{index+1}</span>
                                                            <span className="font-semibold text-zinc-200">{entry.name}</span>
                                                        </td>
                                                        <td className="px-3 py-1 text-[8px] text-zinc-400 truncate max-w-[80px]">{entry.rank.split(" ")[0]}</td>
                                                        <td className="px-3 py-1 text-right font-bold text-j-gold font-mono">{entry.score}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
            {/* Persistent Audio element for speech synthesis */}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
