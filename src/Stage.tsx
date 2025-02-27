import {ReactElement, useState} from "react";

import {StageBase, StageResponse, InitialData, Message} from "@chub-ai/stages-ts";

import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";



/***

 The type that this stage persists message-level state in.

 This is primarily for readability, and not enforced.



 @description This type is saved in the database after each message,

 which makes it ideal for storing things like positions and statuses,

 but not for things like history, which is best managed ephemerally

 in the internal state of the Stage class itself.

 ***/

type MessageStateType = any;



/***

 The type of the stage-specific configuration of this stage.



 @description This is for things you want people to be able to configure,

 like background color.

 ***/

type ConfigType = any;



/***

 The type that this stage persists chat initialization state in.

 If there is any 'constant once initialized' static state unique to a chat,

 like procedurally generated terrain that is only created ONCE and ONLY ONCE per chat,

 it belongs here.

 ***/

type InitStateType = any;



/***

 The type that this stage persists dynamic chat-level state in.

 This is for any state information unique to a chat,

    that applies to ALL branches and paths such as clearing fog-of-war.

 It is usually unlikely you will need this, and if it is used for message-level

    data like player health then it will enter an inconsistent state whenever

    they change branches or jump nodes. Use MessageStateType for that.

 ***/

type ChatStateType = any;



/***

 A simple example class that implements the interfaces necessary for a Stage.

 If you want to rename it, be sure to modify App.js as well.

 @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/stage.ts

 ***/

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {



    /***

     A very simple example internal state. Can be anything.

     This is ephemeral in the sense that it isn't persisted to a database,

     but exists as long as the instance does, i.e., the chat page is open.

     ***/

    myInternalState: {[key: string]: any};



    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {

        /***

         This is the first thing called in the stage,

         to create an instance of it.

         The definition of InitialData is at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/initial.ts

         Character at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/character.ts

         User at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/user.ts

         ***/

        super(data);

        const {

            characters,         // @type:  { [key: string]: Character }

            users,                  // @type:  { [key: string]: User}

            config,                                 //  @type:  ConfigType

            messageState,                           //  @type:  MessageStateType

            environment,                    // @type: Environment (which is a string)

            initState,                            // @type: null | InitStateType

            chatState                             // @type: null | ChatStateType

        } = data;

        this.myInternalState = messageState != null ? messageState : {'someKey': 'someValue'};

        this.myInternalState['numUsers'] = Object.keys(users).length;

        this.myInternalState['numChars'] = Object.keys(characters).length;

    }



    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

        /***

         This is called immediately after the constructor, in case there is some asynchronous code you need to

         run on instantiation.

         ***/

        return {

            /*** @type boolean @default null

             @description The 'success' boolean returned should be false IFF (if and only if), some condition is met that means

              the stage shouldn't be run at all and the iFrame can be closed/removed.

              For example, if a stage displays expressions and no characters have an expression pack,

              there is no reason to run the stage, so it would return false here. ***/

            success: true,

            /*** @type null | string @description an error message to show

             briefly at the top of the screen, if any. ***/

            error: null,

            initState: null,

            chatState: null,

        };

    }



    async setState(state: MessageStateType): Promise<void> {

        /***

         This can be called at any time, typically after a jump to a different place in the chat tree

         or a swipe. Note how neither InitState nor ChatState are given here. They are not for

         state that is affected by swiping.

         ***/

        if (state != null) {

            this.myInternalState = {...this.myInternalState, ...state};

        }

    }



    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {

        /***

         This is called after someone presses 'send', but before anything is sent to the LLM.

         ***/

        const {

            content,           /*** @type: string

             @description Just the last message about to be sent. ***/

            anonymizedId,       /*** @type: string

             @description An anonymized ID that is unique to this individual

              in this chat, but NOT their Chub ID. ***/

            isBot            /*** @type: boolean

             @description Whether this is itself from another bot, ex. in a group chat. ***/

        } = userMessage;

        return {

            /*** @type null | string @description A string to add to the

             end of the final prompt sent to the LLM,

             but that isn't persisted. ***/

            stageDirections: null,

            /*** @type MessageStateType | null @description the new state after the userMessage. ***/

            messageState: {'someKey': this.myInternalState['someKey']},

            /*** @type null | string @description If not null, the user's message itself is replaced

             with this value, both in what's sent to the LLM and in the database. ***/

            modifiedMessage: null,

            /*** @type null | string @description A system message to append to the end of this message.

             This is unique in that it shows up in the chat log and is sent to the LLM in subsequent messages,

             but it's shown as coming from a system user and not any member of the chat. If you have things like

             computed stat blocks that you want to show in the log, but don't want the LLM to start trying to

             mimic/output them, they belong here. ***/

            systemMessage: null,

            /*** @type null | string @description an error message to show

             briefly at the top of the screen, if any. ***/

            error: null,

            chatState: null,

        };

    }



    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {

        /***

         This is called immediately after a response from the LLM.

         ***/

        const {

            content,           /*** @type: string

             @description The LLM's response. ***/

            anonymizedId,       /*** @type: string

             @description An anonymized ID that is unique to this individual

              in this chat, but NOT their Chub ID. ***/

            isBot            /*** @type: boolean

             @description Whether this is from a bot, conceivably always true. ***/

        } = botMessage;

        return {

            /*** @type null | string @description A string to add to the

             end of the final prompt sent to the LLM,

             but that isn't persisted. ***/

            stageDirections: null,

            /*** @type MessageStateType | null @description the new state after the botMessage. ***/

            messageState: {'someKey': this.myInternalState['someKey']},

            /*** @type null | string @description If not null, the bot's response itself is replaced

             with this value, both in what's sent to the LLM subsequently and in the database. ***/

            modifiedMessage: null,

            /*** @type null | string @description an error message to show

             briefly at the top of the screen, if any. ***/

            error: null,

            systemMessage: null,

            chatState: null

        };

    }



    render(): ReactElement {
        const { myInternalState } = this;

        const [activeCategory, setActiveCategory] = useState<string | null>(null);

        const renderDetail = (label: string, value: any) => {
            return <div>*{label}: {value}</div>;
        };

        const renderCategory = (categoryName: string, details: JSX.Element) => {
            const isCategoryActive = activeCategory === categoryName;

            return (
                <div>
                    <div>
                        {isCategoryActive ? (
                            <>
                                {categoryName}
                                <button onClick={() => setActiveCategory(null)}>Hide</button>
                            </>
                        ) : (
                            <button onClick={() => setActiveCategory(categoryName)}>
                                {categoryName}
                            </button>
                        )}
                    </div>
                    {isCategoryActive ? details : null}
                </div>
            );
        };

        return (
            <div style={{
                width: '100vw',
                height: '100vh',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
            }}>
                {renderCategory('Body Details', (
                    <div>
                        {renderDetail('Appearance', myInternalState['appearance'])}
                        {renderDetail('Weight', myInternalState['weight'])}
                        {renderDetail('Muscles', myInternalState['muscles'])}
                        {renderDetail('BMI', myInternalState['bmi'])}
                        {renderDetail('Bust', myInternalState['bust'])}
                        {renderDetail('Waist', myInternalState['waist'])}
                        {renderDetail('Hips', myInternalState['hips'])}
                        {renderDetail('Chest', myInternalState['chest'])}
                        {renderDetail('Shoulder Width', myInternalState['shoulderWidth'])}
                        {renderDetail('Neck Size', myInternalState['neckSize'])}
                        {renderDetail('Arm/Sleeve Length', myInternalState['armSleeveLength'])}
                        {renderDetail('Upper Arm Circumference', myInternalState['upperArmCircumference'])}
                        {renderDetail('Wrist Circumference', myInternalState['wristCircumference'])}
                        {renderDetail('Ankle Circumference', myInternalState['ankleCircumference'])}
                        {renderDetail('High Ankle Circumference', myInternalState['highAnkleCircumference'])}
                        {renderDetail('Nape to Waist', myInternalState['napeToWaist'])}
                        {renderDetail('Front Shoulder to Waist', myInternalState['frontShoulderToWaist'])}
                        {renderDetail('Armscye Depth', myInternalState['armscyeDepth'])}
                        {renderDetail('Waist to Knee', myInternalState['waistToKnee'])}
                        {renderDetail('Waist to Hip', myInternalState['waistToHip'])}
                        {renderDetail('Waist to Floor', myInternalState['waistToFloor'])}
                        {renderDetail('Body Rise', myInternalState['bodyRise'])}
                        {renderDetail('Inseam', myInternalState['inseam'])}
                        {renderDetail('Skin Tone', myInternalState['skinTone'])}
                        {renderDetail('Skin Type', myInternalState['skinType'])}
                        {renderDetail('Body Freckles', myInternalState['bodyFreckles'])}
                        {renderDetail('Vagina Description', myInternalState['vaginaDescription'])}
                        {renderDetail('Vagina Tightness', myInternalState['vaginaTightness'])}
                        {renderDetail('Penis Description', myInternalState['penisDescription'])}
                        {renderDetail('Penis Size', myInternalState['penisSize'])}
                        {renderDetail('Balls', myInternalState['balls'])}
                        {renderDetail('Ball Size', myInternalState['ballSize'])}
                        {renderDetail('Height', myInternalState['height'])}
                        {renderDetail('Shoulder Width', myInternalState['shoulderWidth'])}
                        {renderDetail('Breast Size', myInternalState['breastSize'])}
                        {renderDetail('Nipple Size', myInternalState['nippleSize'])}
                        {renderDetail('Ass Size', myInternalState['assSize'])}
                        {renderDetail('Hip Size', myInternalState['hipSize'])}
                        {renderDetail('Thigh Size', myInternalState['thighSize'])}
                        {renderDetail('Finger Nails', myInternalState['fingerNails'])}
                        {renderDetail('Toe Nails', myInternalState['toeNails'])}
                    </div>
                ))}
                {renderCategory('Facial Details', (
                    <div>
                        {renderDetail('Hair Length', myInternalState['hairLength'])}
                        {renderDetail('Hair Color', myInternalState['hairColor'])}
                        {renderDetail('Hair Style', myInternalState['hairStyle'])}
                        {renderDetail('Hair Type', myInternalState['hairType'])}
                        {renderDetail('Fringe', myInternalState['fringe'])}
                        {renderDetail('Current Hair Accessory', myInternalState['currentHairAccessory'])}
                        {renderDetail('Hair Ribbons', myInternalState['hairRibbons'])}
                        {renderDetail('Hair Beads', myInternalState['hairBeads'])}
                        {renderDetail('Hair Bows', myInternalState['hairBows'])}
                        {renderDetail('Hair Clips', myInternalState['hairClips'])}
                        {renderDetail('Hair Accessory Color', myInternalState['hairAccessoryColor'])}
                        {renderDetail('Eye Color', myInternalState['eyeColor'])}
                        {renderDetail('Face Freckles', myInternalState['faceFreckles'])}
                        {renderDetail('Lip Size', myInternalState['lipSize'])}
                        {renderDetail('Ears', myInternalState['ears'])}
                    </div>
                ))}
                {renderCategory('Makeup and Grooming', (
                    <div>
                        <div>Lip Makeup:</div>
                        {renderDetail('Lip Makeup Color', myInternalState['lipMakeupColor'])}
                        {renderDetail('Lip Makeup Style', myInternalState['lipMakeupStyle'])}
                        {renderDetail('Lip Glitter', myInternalState['lipGlitter'])}
                        {renderDetail('Lip Liner', myInternalState['lipLiner'])}
                        <div>Eye Makeup:</div>
                        {renderDetail('Eyeshadow Color', myInternalState['eyeshadowColor'])}
                        {renderDetail('Eyeshadow Style', myInternalState['eyeshadowStyle'])}
                        {renderDetail('Eyeliner Color', myInternalState['eyelinerColor'])}
                        {renderDetail('Eyeliner Style', myInternalState['eyelinerStyle'])}
                        {renderDetail('Eye Glitter', myInternalState['eyeGlitter'])}
                        <div>Lash Makeup:</div>
                        {renderDetail('Fake Lash Style', myInternalState['fakeLashStyle'])}
                        {renderDetail('Mascara Style', myInternalState['mascaraStyle'])}
                        <div>Cheek Makeup:</div>
                        {renderDetail('Blush Color', myInternalState['blushColor'])}
                        {renderDetail('Blush Style', myInternalState['blushStyle'])}
                        {renderDetail('Cheek Glitter', myInternalState['cheekGlitter'])}
                        {renderDetail('Cheek Highlighter', myInternalState['cheekHighlighter'])}
                        <div>Full Face Makeup:</div>
                        {renderDetail('Face Paint Style', myInternalState['facePaintStyle'])}
                        <div>Full Body Makeup:</div>
                        {renderDetail('Body Paint Style', myInternalState['bodyPaintStyle'])}
                        {renderDetail('Body Glitter', myInternalState['bodyGlitter'])}
                    </div>
                ))}
                {renderCategory('Hygiene', (
                    <div>
                        {renderDetail('Body Scent', myInternalState['bodyScent'])}
                        {renderDetail('Breath Scent', myInternalState['breathScent'])}
                        {renderDetail('Body Sweat', myInternalState['bodySweat'])}
                        {renderDetail('Body Cum', myInternalState['bodyCum'])}
                        {renderDetail('Hair Cum', myInternalState['hairCum'])}
                        {renderDetail('Clothing Cum', myInternalState['clothingCum'])}
                        {renderDetail('Underwear Cum', myInternalState['underwearCum'])}
                    </div>
                ))}
                {renderCategory('Misc', (
                    <div>
                        {renderDetail('Fingernails', myInternalState['fingernails'])}
                        {renderDetail('Toenails', myInternalState['toenails'])}
                    </div>
                ))}
                {renderCategory('Cum Production Details', (
                    <div>
                        {renderDetail('Producing Cum', myInternalState['producingCum'])}
                        {renderDetail('Cum Level', myInternalState['cumLevel'])}
                        {renderDetail('Cum Maximum Cap', myInternalState['cumMaximumCap'])}
                        {renderDetail('Cum Gain Average', myInternalState['cumGainAverage'])}
                        {renderDetail('Cum Consistency', myInternalState['cumConsistency'])}
                    </div>
                ))}
                {renderCategory('Milk Production Details', (
                    <div>
                        {renderDetail('Producing Milk', myInternalState['producingMilk'])}
                        {renderDetail('Milk Level', myInternalState['milkLevel'])}
                        {renderDetail('Milk Maximum Cap', myInternalState['milkMaximumCap'])}
                        {renderDetail('Milk Gain Average', myInternalState['milkGainAverage'])}
                        {renderDetail('Milk Consistency', myInternalState['milkConsistency'])}
                    </div>
                ))}
                {renderCategory('Squirt Production Details (Vagina Discharge During Orgasm)', (
                    <div>
                        {renderDetail('Producing Squirt', myInternalState['producingSquirt'])}
                        {renderDetail('Squirt Level', myInternalState['squirtLevel'])}
                        {renderDetail('Squirt Maximum Cap', myInternalState['squirtMaximumCap'])}
                        {renderDetail('Squirt Gain Average', myInternalState['squirtGainAverage'])}
                        {renderDetail('Squirt Consistency', myInternalState['squirtConsistency'])}
                    </div>
                ))}
                {renderCategory('Clothing Details', (
                    <div>
                        {renderDetail('Clothing Worn', myInternalState['clothingWorn'])}
                        {renderDetail('Underwear Worn', myInternalState['underwearWorn'])}
                        {renderDetail('Neckwear', myInternalState['neckwear'])}
                        {renderDetail('Neckwear Locked', myInternalState['neckwearLocked'])}
                        {renderDetail('Butt Plug Worn', myInternalState['buttPlugWorn'])}
                        {renderDetail('Currently Worn Main Chastity Device', myInternalState['currentlyWornMainChastityDevice'])}
                    </div>
                ))}
            </div>
        );
    }

}