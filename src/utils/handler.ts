import { RawRider } from '../models/RawRider';
import { RawPicker } from '../models/RawPicker';
import { removeBackticks } from './sanitize';
import { parseCSV } from './csvParse'; // Assuming CSV parsing utility

// Function to handle the picker file upload
export async function uploadPickerFile(fileBuffer: Buffer) {
    try {
        const pickerData = await parseCSV(fileBuffer);

        const normalizedRiderData = pickerData.map((row) => {
        const newRow: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
            if (!key) return; // skip empty headers
            const cleanKey = key.trim(); // remove trailing/leading spaces
            newRow[cleanKey] = row[key];
        });
        return newRow;
        });

        // Sanitize data by removing backticks from relevant fields
        const sanitizedPickerData = normalizedRiderData.map((row) => ({
            ...row,
            orderNumber: removeBackticks(row.orderNumber),
            suborderNumber: removeBackticks(row.suborderNumber),
            sku: removeBackticks(row.sku),
            serialNumber: removeBackticks(row.serialNumber),
            bin: removeBackticks(row.bin),
            picker: removeBackticks(row.picker),
            awbNumber: removeBackticks(row.awbNumber),
        }));

        // Bulk insert the sanitized data into RawPicker model
        await bulkInsertModel(sanitizedPickerData, RawPicker);
    } catch (error) {
        console.error('Error uploading picker file:', error);
        throw new Error('Error uploading picker file');
    }
}

// Function to handle the rider file upload


export async function uploadRiderFile(fileBuffer: Buffer) {
    try {
        const riderData = await parseCSV(fileBuffer);
        //console.log('Parsed Rider Data:', riderData);

        const normalizedRiderData = riderData.map((row) => {
        const newRow: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
            if (!key) return; // skip empty headers
            const cleanKey = key.trim(); // remove trailing/leading spaces
            newRow[cleanKey] = row[key];
        });
        return newRow;
        });

        const sanitizedRiderData = normalizedRiderData.map((row) => ({
            cdrId: row['CDR ID'] ? removeBackticks(row['CDR ID']) : null,
            choId: row['CHOID'] ? removeBackticks(row['CHOID']) : null,
            referenceId: row['Reference ID'] ? removeBackticks(row['Reference ID']) : null,
            channel: row['Channel'] ? removeBackticks(row['Channel']) : null,
            creationDate: row['Creation Date'] ? row['Creation Date'] : null, // Ensure it's in the correct format
            senderAddress: row['Sender Address'] ? removeBackticks(row['Sender Address']) : null,
            senderName: row['Sender Name'] ? removeBackticks(row['Sender Name']) : null,
            senderContact: row['Sender Contact'] ? row['Sender Contact'] : null,
            customerAddress: row['Customer Address'] ? removeBackticks(row['Customer Address']) : null,
            customerName: row['Customer Name'] ? removeBackticks(row['Customer Name']) : null,
            customerContact: row['Customer Contact'] ? row['Customer Contact'] : null,
            billAmount: row['Bill Amount'] ? parseFloat(row['Bill Amount']) : null, // Ensure this is a number
            codAmount: row['COD Amount'] ? parseFloat(row['COD Amount']) : null, // Ensure this is a number
            deliveryDate: row['Delivery Date'] ? row['Delivery Date'] : null,
            deliverySlot: row['Delivery Slot'] ? row['Delivery Slot'] : null,
            deliveryMasterZone: row['Delivery Master Zone'] ? row['Delivery Master Zone'] : null,
            pickupMasterZone: row['Pickup Master Zone'] ? row['Pickup Master Zone'] : null,
            deliveryBusinessZone: row['Delivery Business Zone'] ? row['Delivery Business Zone'] : null,
            pickupBusinessZone: row['Pickup Business Zone'] ? row['Pickup Business Zone'] : null,
            totalWeight: row['Total Weight'] ? parseFloat(row['Total Weight']) : null, // Ensure this is a number
            totalVolume: row['Total Volume'] ? parseFloat(row['Total Volume']) : null, // Ensure this is a number
            fulfillmentStatus: row['Fulfillment Status'] ? row['Fulfillment Status'] : null,
            manifestedTime: row['Manifested Time'] ? row['Manifested Time'] : null,
            outForPickupTime: row['Out For Pickup Time'] ? row['Out For Pickup Time'] : null,
            reachedPickupTime: row['Reached Pickup Time'] ? row['Reached Pickup Time'] : null,
            pickupTime: row['Pickup Time'] ? row['Pickup Time'] : null,
            outForDeliveryTime: row['Out For Delivery Time'] ? row['Out For Delivery Time'] : null,
            reachedDeliveryTime: row['Reached Delivery Time'] ? row['Reached Delivery Time'] : null,
            terminalTime: row['Terminal Time'] ? row['Terminal Time'] : null,
            pickupToDropDistance: row['Pickup to Drop Distance(Kms)'] ? parseFloat(row['Pickup to Drop Distance(Kms)']) : null, // Ensure this is a number
            notes: row['Notes'] ? removeBackticks(row['Notes']) : null,
            failedAttemptCount: row['Failed Attempt Count'] ? parseInt(row['Failed Attempt Count']) : null, // Ensure this is an integer
            lastFailedRemark: row['Last Failed Remark'] ? removeBackticks(row['Last Failed Remark']) : null,
            cancellationDate: row['Cancellation Date'] ? row['Cancellation Date'] : null,
            status: row['Status'] ? row['Status'] : null,
            ownerId: row['Owner ID'] ? row['Owner ID'] : null,
            lekertInput: row['Lekert Input'] ? removeBackticks(row['Lekert Input']) : null,
            feedback: row['Feedback'] ? removeBackticks(row['Feedback']) : null,
            callbackRequest: row['Callback Request'] ? removeBackticks(row['Callback Request']) : null,
            submitDate: row['Submit Date'] ? row['Submit Date'] : null,
            riderName: row['Rider Name'] ? removeBackticks(row['Rider Name']) : null,
            riderId: row['Rider ID'] ? row['Rider ID'] : null,
            trackingLink: row['Tracking Link'] ? removeBackticks(row['Tracking Link']) : null,
            edt: row['EDT(Expected Delivery Time)'] ? row['EDT(Expected Delivery Time)'] : null,
            adt: row['ADT(Actual Delivery Time)'] ? row['ADT(Actual Delivery Time)'] : null,
            partnerName: row['Partner Name'] ? row['Partner Name'] : null,
            partnerId: row['Partner ID'] ? row['Partner ID'] : null,
            deliveryCharge: row['Delivery Charge'] ? row['Delivery Charge'] : null,
            failedPartnerAllocations: row['Failed Partner Allocations'] ? row['Failed Partner Allocations'] : null,
            firstAllocationRequest: row['First Allocation Request'] ? row['First Allocation Request'] : null,
            fulfillmentRequestTime: row['Fulfillment Request Time'] ? row['Fulfillment Request Time'] : null,
            creationDateTime: row['Creation Date '] ? row['Creation Date '] : null,
            timeTaken: row['Time taken '] ? parseInt(row['Time taken ']) : null, // Ensure this is an integer
            slaMinsPromised: row['SLA Mins promised'] ? row['SLA Mins promised'] : null,
            slaBreach: row['SLA Breach (Yes/No)'] ? row['SLA Breach (Yes/No)'] : null,
            calculateSlaBreachMinutes: row['Calculate SLA Breach Minutes'] ? row['Calculate SLA Breach Minutes'] : null
        }));

        console.log('Sanitized Rider Data:', sanitizedRiderData);

        // Bulk insert the sanitized data into RawRider model
        await bulkInsertModel(sanitizedRiderData, RawRider);
    } catch (error) {
        console.error('Error uploading rider file:', error);
        throw new Error('Error uploading rider file');
    }
}



// Generic function for bulk insertion into any model
async function bulkInsertModel(data: any[], model: any) {
    try {
        await model.bulkCreate(data, {
            ignoreDuplicates: true, // Prevent duplicates
            returning: true,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            // TypeScript will now allow accessing error.message
            throw new Error(`Error inserting data into model: ${error.message}`);
        } else {
            // If the error is not of type Error, throw a generic error
            throw new Error('Unknown error occurred during bulk insert');
        }
    }
}

